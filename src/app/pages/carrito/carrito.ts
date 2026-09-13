import { Component, inject, signal } from '@angular/core';
import { CurrencyPipe } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { MsalService } from '@azure/msal-angular';
import { CarritoService } from '../../services/carrito.service';
import { PedidoService } from '../../services/pedido.service';

@Component({
  selector: 'app-carrito',
  imports: [CurrencyPipe, RouterLink],
  templateUrl: './carrito.html',
})
export class Carrito {
  readonly carrito = inject(CarritoService);
  private readonly pedidoService = inject(PedidoService);
  private readonly router = inject(Router);
  private readonly msalService = inject(MsalService);

  // Se lee desde el claim preferred_username del ID token de la cuenta
  // activa en MSAL. Si por algun motivo no hay cuenta activa todavia
  // (carrera con el guard/redirect), cae a idTokenClaims.email o username
  // como respaldo, y como ultimo recurso queda vacio (no se inventa un
  // valor demo, porque romperia la trazabilidad del pedido con el usuario
  // real logueado).
  readonly usuario = signal(this.obtenerUsuarioActivo());
  readonly enviando = signal(false);
  readonly error = signal<string | null>(null);

  private obtenerUsuarioActivo(): string {
    const cuenta = this.msalService.instance.getActiveAccount();
    if (!cuenta) return '';

    const claims = cuenta.idTokenClaims as Record<string, unknown> | undefined;
    const preferredUsername = claims?.['preferred_username'] as string | undefined;

    return preferredUsername ?? cuenta.username ?? '';
  }

  confirmar(): void {
    if (this.carrito.items().length === 0 || !this.usuario().trim()) return;
    this.enviando.set(true);
    this.error.set(null);

    this.pedidoService.crear({
      usuario: this.usuario().trim(),
      detalles: this.carrito.items().map(i => ({
        productoId: i.producto.id,
        nombreProducto: i.producto.nombre,
        precioUnitario: i.producto.precio,
        cantidad: i.cantidad,
      })),
    }).subscribe({
      next: pedido => {
        this.carrito.vaciar();
        this.enviando.set(false);
        this.router.navigate(['/pedidos'], { queryParams: { creado: pedido.id } });
      },
      error: err => {
        this.enviando.set(false);
        this.error.set(err.status === 0
          ? 'No hay conexión con ms-pedidos (puerto 8081).'
          : `Error ${err.status} al crear el pedido.`);
      },
    });
  }
}