import { Component, inject, input, signal } from '@angular/core';
import { CurrencyPipe, DatePipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { PedidoService } from '../../services/pedido.service';
import { Pedido } from '../../models/pedido';

@Component({
  selector: 'app-pedidos',
  imports: [CurrencyPipe, DatePipe, RouterLink],
  templateUrl: './pedidos.html',
})
export class Pedidos {
  private readonly pedidoService = inject(PedidoService);

  /** ?creado=<id> al volver del carrito */
  readonly creado = input<string>();

  readonly pedidos = signal<Pedido[]>([]);
  readonly cargando = signal(true);
  readonly error = signal<string | null>(null);
  readonly abierto = signal<number | null>(null);

  readonly estados = ['CREADO', 'PAGADO', 'ENVIADO', 'ENTREGADO', 'CANCELADO'];

  constructor() {
    this.cargar();
  }

  cargar(): void {
    this.cargando.set(true);
    // Mañana: si el rol es "cliente", listar(usuarioDelToken); si es "admin", listar().
    this.pedidoService.listar().subscribe({
      next: ps => {
        this.pedidos.set([...ps].sort((a, b) => (b.id ?? 0) - (a.id ?? 0)));
        this.cargando.set(false);
      },
      error: err => {
        this.error.set(err.status === 0 ? 'No hay conexión con ms-pedidos (puerto 8081).' : `Error ${err.status}.`);
        this.cargando.set(false);
      },
    });
  }

  toggle(id: number | undefined): void {
    if (id === undefined) return;
    this.abierto.set(this.abierto() === id ? null : id);
  }

  cambiarEstado(p: Pedido, estado: string): void {
    if (p.id === undefined || estado === p.estado) return;
    this.pedidoService.cambiarEstado(p.id, estado).subscribe({
      next: actualizado => this.pedidos.update(ps => ps.map(x => (x.id === actualizado.id ? actualizado : x))),
    });
  }

  estadoClase(estado?: string): string {
    switch (estado) {
      case 'CREADO':    return 'bg-[#282a32] text-[#cfc2d6]';
      case 'PAGADO':    return 'bg-[#00686f]/40 text-[#7df4ff]';
      case 'ENVIADO':   return 'bg-[#6900b3]/40 text-[#ddb7ff]';
      case 'ENTREGADO': return 'bg-[#005228]/50 text-[#60ff99]';
      case 'CANCELADO': return 'bg-[#93000a]/40 text-[#ffb4ab]';
      default:          return 'bg-[#282a32] text-[#cfc2d6]';
    }
  }
}
