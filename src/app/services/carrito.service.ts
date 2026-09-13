import { Injectable, computed, signal } from '@angular/core';
import { Producto } from '../models/producto';

export interface ItemCarrito {
  producto: Producto;
  cantidad: number;
}

/**
 * Carrito en memoria con signals. Vive mientras la pestaña esté abierta.
 * Al confirmar, se transforma en un NuevoPedido para mspedidos.
 */
@Injectable({ providedIn: 'root' })
export class CarritoService {
  private readonly _items = signal<ItemCarrito[]>([]);

  readonly items = this._items.asReadonly();
  readonly cantidadTotal = computed(() =>
    this._items().reduce((acc, i) => acc + i.cantidad, 0)
  );
  readonly total = computed(() =>
    this._items().reduce((acc, i) => acc + i.producto.precio * i.cantidad, 0)
  );

  agregar(producto: Producto, cantidad = 1): void {
    this._items.update(items => {
      const existente = items.find(i => i.producto.id === producto.id);
      if (existente) {
        return items.map(i =>
          i.producto.id === producto.id
            ? { ...i, cantidad: Math.min(i.cantidad + cantidad, producto.stock) }
            : i
        );
      }
      return [...items, { producto, cantidad }];
    });
  }

  cambiarCantidad(productoId: number, cantidad: number): void {
    if (cantidad <= 0) return this.quitar(productoId);
    this._items.update(items =>
      items.map(i => (i.producto.id === productoId ? { ...i, cantidad } : i))
    );
  }

  quitar(productoId: number): void {
    this._items.update(items => items.filter(i => i.producto.id !== productoId));
  }

  vaciar(): void {
    this._items.set([]);
  }
}
