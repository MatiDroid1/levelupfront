import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Injectable, computed, inject, signal } from '@angular/core';
import { MsalService } from '@azure/msal-angular';

import {
  EMPTY,
  Observable,
  catchError,
  exhaustMap,
  tap,
  timer,
} from 'rxjs';

import { environment } from '../../environments/environment';
import { Notificacion } from '../models/notificacion';

@Injectable({ providedIn: 'root' })
export class NotificacionService {
  private readonly http = inject(HttpClient);
  private readonly msal = inject(MsalService);

  private readonly baseUrl = environment.apiNotificaciones;

  private cuentaId: string | null = null;

  private readonly lista = signal<Notificacion[]>([]);

  readonly notificaciones = this.lista.asReadonly();
  readonly cargando = signal(false);
  readonly error = signal<string | null>(null);

  readonly noLeidas = computed(
    () => this.lista().filter(n => !n.leida).length,
  );

  conectar(cuentaId: string): Observable<unknown> {
    if (this.cuentaId !== cuentaId) {
      this.limpiar();
      this.cuentaId = cuentaId;
    }

    this.cargando.set(true);

    return timer(0, 10_000).pipe(
      exhaustMap(() => this.consultar()),
    );
  }

  limpiar(): void {
    this.cuentaId = null;
    this.lista.set([]);
    this.cargando.set(false);
    this.error.set(null);
  }

  private cuentaVigente(cuentaId: string | null): boolean {
    return cuentaId !== null &&
      this.cuentaId === cuentaId &&
      this.msal.instance.getActiveAccount()?.homeAccountId === cuentaId;
  }

  private consultar(): Observable<unknown> {
    const cuentaId = this.cuentaId;

    if (!this.cuentaVigente(cuentaId)) {
      this.limpiar();
      return EMPTY;
    }

    return this.http.get<Notificacion[]>(this.baseUrl).pipe(
      tap(notificaciones => {
        if (!this.cuentaVigente(cuentaId)) return;

        this.lista.set(notificaciones);
        this.error.set(null);
        this.cargando.set(false);
      }),
      catchError((err: HttpErrorResponse) => {
        if (this.cuentaVigente(cuentaId)) {
          this.error.set(this.mensajeError(err));
          this.cargando.set(false);
        }

        // La próxima consulta periódica puede volver a intentarlo.
        return EMPTY;
      }),
    );
  }

  marcarLeida(id: number): Observable<Notificacion> {
    const cuentaId = this.cuentaId;

    if (!this.cuentaVigente(cuentaId)) {
      return EMPTY;
    }

    return this.http.patch<Notificacion>(
      `${this.baseUrl}/${id}/leida`,
      {},
    ).pipe(
      tap(actualizada => {
        if (!this.cuentaVigente(cuentaId)) return;

        this.lista.update(notificaciones =>
          notificaciones.map(n =>
            n.id === actualizada.id ? actualizada : n,
          ),
        );

        this.error.set(null);
      }),
      catchError((err: HttpErrorResponse) => {
        if (this.cuentaVigente(cuentaId)) {
          this.error.set(this.mensajeError(err));
        }

        return EMPTY;
      }),
    );
  }

  private mensajeError(err: HttpErrorResponse): string {
    switch (err.status) {
      case 0:
        return 'No se pudo conectar con el servicio de notificaciones.';

      case 401:
        return 'No se pudo autenticar la consulta. Revisa tu sesión.';

      case 403:
        return 'Tu cuenta no tiene permiso para esta operación.';

      case 404:
        return 'No se encontró el recurso de notificaciones.';

      default:
        return `No se pudieron actualizar las notificaciones (${err.status}).`;
    }
  }
}