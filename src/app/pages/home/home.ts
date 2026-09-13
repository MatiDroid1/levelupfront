import { Component, inject, signal } from '@angular/core';
import { CurrencyPipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { ProductoService } from '../../services/producto.service';
import { CarritoService } from '../../services/carrito.service';
import { Producto } from '../../models/producto';

@Component({
  selector: 'app-home',
  imports: [RouterLink, CurrencyPipe],
  templateUrl: './home.html',
})
export class Home {
  private readonly productoService = inject(ProductoService);
  readonly carrito = inject(CarritoService);

  readonly destacados = signal<Producto[]>([]);

  readonly categorias = [
    { nombre: 'Teclados', icono: 'keyboard' },
    { nombre: 'Mouse', icono: 'mouse' },
    { nombre: 'Tarjetas Gráficas', icono: 'memory' },
    { nombre: 'Monitores', icono: 'monitor' },
    { nombre: 'Audio', icono: 'headphones' },
    { nombre: 'Accesorios', icono: 'widgets' },
  ];

  readonly pilares = [
    { icono: 'shield', titulo: 'Identidad Entra ID', texto: 'Login con Microsoft y tokens JWT validados en cada microservicio.' },
    { icono: 'hub', titulo: 'Microservicios', texto: 'ms-productos y ms-pedidos en Spring Boot, desacoplados y desplegados en AWS.' },
    { icono: 'cloud_done', titulo: 'API Gateway', texto: 'Rutas públicas y protegidas con CORS y validación de tokens.' },
  ];

  constructor() {
    this.productoService.listar().subscribe({
      next: ps => this.destacados.set(ps.slice(0, 4)),
      error: () => this.destacados.set([]),
    });
  }
}
