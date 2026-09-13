import { Component, computed, inject, input, signal } from '@angular/core';
import { CurrencyPipe } from '@angular/common';
import { ProductoService } from '../../services/producto.service';
import { CarritoService } from '../../services/carrito.service';
import { Producto } from '../../models/producto';

@Component({
  selector: 'app-catalogo',
  imports: [CurrencyPipe],
  templateUrl: './catalogo.html',
})
export class Catalogo {
  private readonly productoService = inject(ProductoService);
  readonly carrito = inject(CarritoService);

  /** Viene de ?categoria=... gracias a withComponentInputBinding() */
  readonly categoria = input<string>();

  readonly productos = signal<Producto[]>([]);
  readonly cargando = signal(true);
  readonly error = signal<string | null>(null);

  readonly busqueda = signal('');
  readonly categoriaActiva = signal<string>('Todas');
  readonly agregadoId = signal<number | null>(null);
  /** SKUs cuya imagen no se encontró en public/img/productos → se muestra ícono */
  readonly sinImagen = signal<Set<string>>(new Set());

  readonly categorias = computed(() => [
    'Todas',
    ...Array.from(new Set(this.productos().map(p => p.categoria))).sort(),
  ]);

  readonly filtrados = computed(() => {
    const q = this.busqueda().trim().toLowerCase();
    const cat = this.categoriaActiva();
    return this.productos().filter(p => {
      const okCat = cat === 'Todas' || p.categoria === cat;
      const okQ = !q || p.nombre.toLowerCase().includes(q) || p.sku.toLowerCase().includes(q);
      return okCat && okQ;
    });
  });

  constructor() {
    this.productoService.listar().subscribe({
      next: ps => {
        this.productos.set(ps);
        this.cargando.set(false);
        const inicial = this.categoria();
        if (inicial && ps.some(p => p.categoria === inicial)) {
          this.categoriaActiva.set(inicial);
        }
      },
      error: err => {
        this.error.set(err.status === 0
          ? 'No hay conexión con ms-productos (puerto 8080). Revisa que esté corriendo y que CORS esté configurado.'
          : `Error ${err.status} al cargar el catálogo.`);
        this.cargando.set(false);
      },
    });
  }

  agregar(p: Producto): void {
    this.carrito.agregar(p);
    this.agregadoId.set(p.id);
    setTimeout(() => this.agregadoId.set(null), 900);
  }

  marcarSinImagen(sku: string): void {
    this.sinImagen.update(s => new Set(s).add(sku));
  }

  iconoCategoria(categoria: string): string {
    const iconos: Record<string, string> = {
      'Teclados': 'keyboard', 'Mouse': 'mouse', 'Monitores': 'monitor',
      'Audio': 'headphones', 'Tarjetas Gráficas': 'memory',
    };
    return iconos[categoria] ?? 'widgets';
  }

  stockClase(stock: number): string {
    if (stock === 0) return 'text-[#ffb4ab]';
    if (stock <= 5) return 'text-[#ffd680]';
    return 'text-[#00e479]';
  }
}
