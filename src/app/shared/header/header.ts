import {
  Component,
  inject,
  OnInit,
  OnDestroy,
} from '@angular/core';

import { CommonModule } from '@angular/common';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { Subject } from 'rxjs';
import { filter, takeUntil } from 'rxjs/operators';

import {
  MsalService,
  MsalBroadcastService,
} from '@azure/msal-angular';

import {
  InteractionStatus,
} from '@azure/msal-browser';

import { CarritoService } from '../../services/carrito.service';

const BACKEND_SCOPE =
  'api://260c8d4a-9eae-4da8-9e2b-76c587b25b85/access_as_user';

@Component({
  selector: 'app-header',
  imports: [
    CommonModule,
    RouterLink,
    RouterLinkActive,
  ],
  templateUrl: './header.html',
})
export class Header implements OnInit, OnDestroy {
  readonly carrito = inject(CarritoService);

  private readonly msalService = inject(MsalService);

  private readonly msalBroadcastService =
    inject(MsalBroadcastService);

  private readonly destroying$ = new Subject<void>();

  private cuentaComprobada: string | null = null;
  private comprobandoRol = false;

  readonly links = [
    { label: 'Inicio', path: '/' },
    { label: 'Catálogo Gamer', path: '/catalogo' },
    { label: 'Mis Pedidos', path: '/pedidos' },
  ];

  usuario: string | null = null;
  esAdmin = false;
  botonesDeshabilitados = false;

  ngOnInit(): void {
    this.msalBroadcastService.inProgress$
      .pipe(takeUntil(this.destroying$))
      .subscribe((status: InteractionStatus) => {
        this.botonesDeshabilitados =
          status !== InteractionStatus.None;
      });

    this.msalBroadcastService.inProgress$
      .pipe(
        filter(
          (status: InteractionStatus) =>
            status === InteractionStatus.None,
        ),
        takeUntil(this.destroying$),
      )
      .subscribe(() => {
        this.actualizarUsuarioActivo();
      });
  }

  ngOnDestroy(): void {
    this.destroying$.next();
    this.destroying$.complete();
  }

  private actualizarUsuarioActivo(): void {
    const account =
      this.msalService.instance.getActiveAccount() ??
      this.msalService.instance.getAllAccounts()[0];

    if (!account) {
      this.usuario = null;
      this.esAdmin = false;
      this.cuentaComprobada = null;
      return;
    }

    this.msalService.instance.setActiveAccount(account);
    this.usuario = account.name ?? account.username;

    if (
      this.comprobandoRol ||
      this.cuentaComprobada === account.homeAccountId
    ) {
      return;
    }

    this.esAdmin = false;
    this.comprobandoRol = true;

    this.msalService.acquireTokenSilent({
      account,
      scopes: [BACKEND_SCOPE],
    })
      .pipe(takeUntil(this.destroying$))
      .subscribe({
        next: result => {
          this.comprobandoRol = false;

          const activeAccount =
            this.msalService.instance.getActiveAccount();

          if (
            activeAccount?.homeAccountId !== account.homeAccountId
          ) {
            this.cuentaComprobada = null;
            this.actualizarUsuarioActivo();
            return;
          }

          this.cuentaComprobada = account.homeAccountId;
          this.esAdmin = this.tokenTieneRolAdmin(
            result.accessToken,
          );
        },
        error: () => {
          this.comprobandoRol = false;
          this.esAdmin = false;
          this.cuentaComprobada = null;
        },
      });
  }

  private tokenTieneRolAdmin(accessToken: string): boolean {
    try {
      const encodedPayload = accessToken.split('.')[1];

      if (!encodedPayload) {
        return false;
      }

      const normalized = encodedPayload
        .replace(/-/g, '+')
        .replace(/_/g, '/');

      const padded = normalized.padEnd(
        Math.ceil(normalized.length / 4) * 4,
        '=',
      );

      const payload = JSON.parse(atob(padded)) as {
        roles?: string[];
      };

      return Array.isArray(payload.roles) &&
        payload.roles.includes('admin');
    } catch {
      return false;
    }
  }

  login(): void {
    this.msalService.loginRedirect({
      scopes: ['User.Read', BACKEND_SCOPE],
    });
  }

  logout(): void {
    this.esAdmin = false;
    this.cuentaComprobada = null;
    this.msalService.logoutRedirect();
  }
}