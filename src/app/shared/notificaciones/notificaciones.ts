import {
  Component,
  DestroyRef,
  ElementRef,
  HostListener,
  OnInit,
  inject,
  signal,
} from '@angular/core';

import { DatePipe } from '@angular/common';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { RouterLink } from '@angular/router';

import {
  MsalBroadcastService,
  MsalService,
} from '@azure/msal-angular';

import { InteractionStatus } from '@azure/msal-browser';

import { EMPTY, switchMap } from 'rxjs';

import { NotificacionService } from '../../services/notificacion.service';

@Component({
  selector: 'app-notificaciones',
  standalone: true,
  imports: [DatePipe, RouterLink],
  templateUrl: './notificaciones.html',
  styleUrl: './notificaciones.css',
})
export class Notificaciones implements OnInit {
  readonly servicio = inject(NotificacionService);

  private readonly msal = inject(MsalService);
  private readonly broadcast = inject(MsalBroadcastService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly elemento = inject(ElementRef<HTMLElement>);

  readonly abierto = signal(false);
  readonly autenticado = signal(false);
  readonly procesando = signal<number | null>(null);

  ngOnInit(): void {
    this.broadcast.inProgress$.pipe(
      switchMap(status => {
        this.abierto.set(false);
        this.autenticado.set(false);
        this.servicio.limpiar();

        if (status !== InteractionStatus.None) {
          return EMPTY;
        }

        const cuenta =
          this.msal.instance.getActiveAccount() ??
          this.msal.instance.getAllAccounts()[0];

        if (!cuenta) {
          return EMPTY;
        }

        this.msal.instance.setActiveAccount(cuenta);
        this.autenticado.set(true);

        return this.servicio.conectar(cuenta.homeAccountId);
      }),
      takeUntilDestroyed(this.destroyRef),
    ).subscribe();

    this.destroyRef.onDestroy(() => {
      this.servicio.limpiar();
    });
  }

  toggle(): void {
    this.abierto.update(valor => !valor);
  }

  cerrar(): void {
    this.abierto.set(false);
  }

  marcarLeida(id: number): void {
    if (this.procesando() !== null) return;

    this.procesando.set(id);

    this.servicio.marcarLeida(id).pipe(
      takeUntilDestroyed(this.destroyRef),
    ).subscribe({
      complete: () => this.procesando.set(null),
    });
  }

  @HostListener('document:click', ['$event'])
  cerrarAlPulsarFuera(event: MouseEvent): void {
    const destino = event.target as Node | null;

    if (
      destino &&
      !this.elemento.nativeElement.contains(destino)
    ) {
      this.cerrar();
    }
  }

  @HostListener('document:keydown.escape')
  cerrarConEscape(): void {
    this.cerrar();
  }
}