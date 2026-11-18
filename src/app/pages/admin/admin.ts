import {
  Component,
  OnInit,
  inject,
  signal,
} from '@angular/core';

import { CurrencyPipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpErrorResponse } from '@angular/common/http';
import { RouterLink } from '@angular/router';

import { ProductoService } from '../../services/producto.service';
import { Producto } from '../../models/producto';

@Component({
  selector: 'app-admin',
  standalone: true,
  imports: [
    FormsModule,
    CurrencyPipe,
    RouterLink,
  ],
  template: `
    <main class="admin">
      <a routerLink="/catalogo">Volver al catálogo</a>

      <h1>Administración de productos</h1>
      <p>Crea y elimina productos del catálogo.</p>

      @if (mensaje()) {
        <p class="mensaje" role="status">
          {{ mensaje() }}
        </p>
      }

      @if (error()) {
        <p class="error" role="alert">
          {{ error() }}
        </p>
      }

      <section class="panel">
        <h2>Nuevo producto</h2>

        <form #form="ngForm" (ngSubmit)="crear()">
          <label>
            SKU
            <input
              name="sku"
              [(ngModel)]="nuevo.sku"
              required
            />
          </label>

          <label>
            Nombre
            <input
              name="nombre"
              [(ngModel)]="nuevo.nombre"
              required
            />
          </label>

          <label>
            Categoría
            <input
              name="categoria"
              [(ngModel)]="nuevo.categoria"
              required
            />
          </label>

          <label>
            Precio
            <input
              name="precio"
              type="number"
              [(ngModel)]="nuevo.precio"
              min="1"
              required
            />
          </label>

          <label>
            Stock
            <input
              name="stock"
              type="number"
              [(ngModel)]="nuevo.stock"
              min="0"
              step="1"
              required
            />
          </label>

          <button
            type="submit"
            [disabled]="form.invalid || ocupado()"
          >
            {{ ocupado() ? 'Procesando…' : 'Crear producto' }}
          </button>
        </form>
      </section>

      <section class="panel">
        <div class="encabezado">
          <h2>Productos</h2>

          <button
            type="button"
            (click)="cargar()"
            [disabled]="ocupado() || cargando()"
          >
            Actualizar
          </button>
        </div>

        @if (cargando()) {
          <p>Cargando productos…</p>
        }

        <div class="tabla">
          <table>
            <thead>
              <tr>
                <th>SKU</th>
                <th>Nombre</th>
                <th>Categoría</th>
                <th>Precio</th>
                <th>Stock</th>
                <th>Acción</th>
              </tr>
            </thead>

            <tbody>
              @for (producto of productos(); track producto.id) {
                <tr>
                  <td>{{ producto.sku }}</td>
                  <td>{{ producto.nombre }}</td>
                  <td>{{ producto.categoria }}</td>
                  <td>
                    {{
                      producto.precio
                        | currency:'CLP':'symbol-narrow':'1.0-0'
                    }}
                  </td>
                  <td>{{ producto.stock }}</td>
                  <td>
                    <button
                      type="button"
                      class="eliminar"
                      [disabled]="ocupado()"
                      (click)="eliminar(producto)"
                    >
                      Eliminar
                    </button>
                  </td>
                </tr>
              } @empty {
                <tr>
                  <td colspan="6">
                    No hay productos para mostrar.
                  </td>
                </tr>
              }
            </tbody>
          </table>
        </div>
      </section>
    </main>
  `,
  styles: [`
    :host {
      display: block;
      min-height: 80vh;
      color: #f1f5f9;
      background: #0f172a;
    }

    .admin {
      max-width: 1100px;
      margin: auto;
      padding: 32px 20px;
    }

    a {
      color: #67e8f9;
    }

    h1 {
      margin-top: 24px;
    }

    .panel {
      margin-top: 24px;
      padding: 24px;
      border: 1px solid #334155;
      border-radius: 14px;
      background: #1e293b;
    }

    form {
      display: grid;
      grid-template-columns:
        repeat(auto-fit, minmax(180px, 1fr));
      gap: 16px;
      align-items: end;
    }

    label {
      display: flex;
      flex-direction: column;
      gap: 8px;
    }

    input {
      width: 100%;
      box-sizing: border-box;
      padding: 10px;
      color: #f8fafc;
      background: #0f172a;
      border: 1px solid #64748b;
      border-radius: 6px;
    }

    button {
      padding: 10px 14px;
      border: 0;
      border-radius: 6px;
      background: #67e8f9;
      color: #0f172a;
      cursor: pointer;
    }

    button:disabled {
      opacity: .5;
      cursor: not-allowed;
    }

    .eliminar {
      background: #fecaca;
      color: #7f1d1d;
    }

    .mensaje {
      color: #86efac;
    }

    .error {
      color: #fca5a5;
    }

    .encabezado {
      display: flex;
      justify-content: space-between;
      align-items: center;
      gap: 16px;
    }

    .tabla {
      overflow-x: auto;
    }

    table {
      width: 100%;
      border-collapse: collapse;
    }

    th, td {
      padding: 12px;
      text-align: left;
      border-bottom: 1px solid #475569;
    }
  `],
})
export class Admin implements OnInit {
  private readonly servicio = inject(ProductoService);

  readonly productos = signal<Producto[]>([]);
  readonly cargando = signal(false);
  readonly ocupado = signal(false);
  readonly mensaje = signal('');
  readonly error = signal('');

  nuevo: Omit<Producto, 'id'> = this.productoVacio();

  ngOnInit(): void {
    this.cargar();
  }

  cargar(): void {
    if (this.cargando()) return;

    this.cargando.set(true);
    this.error.set('');

    this.servicio.listar().subscribe({
      next: productos => {
        this.productos.set(productos);
        this.cargando.set(false);
      },
      error: (err: HttpErrorResponse) => {
        this.cargando.set(false);
        this.mostrarError(err);
      },
    });
  }

  crear(): void {
    if (this.ocupado()) return;

    const producto: Omit<Producto, 'id'> = {
      ...this.nuevo,
      sku: this.nuevo.sku.trim(),
      nombre: this.nuevo.nombre.trim(),
      categoria: this.nuevo.categoria.trim(),
    };

    if (
      !producto.sku ||
      !producto.nombre ||
      !producto.categoria ||
      !Number.isFinite(producto.precio) ||
      producto.precio <= 0 ||
      !Number.isInteger(producto.stock) ||
      producto.stock < 0
    ) {
      this.error.set(
        'Completa los campos, indica un precio positivo y un stock entero mayor o igual a cero.',
      );
      return;
    }

    this.ocupado.set(true);
    this.error.set('');
    this.mensaje.set('');

    this.servicio.crear(producto).subscribe({
      next: () => {
        this.ocupado.set(false);
        this.nuevo = this.productoVacio();
        this.mensaje.set('Producto creado correctamente.');
        this.cargar();
      },
      error: (err: HttpErrorResponse) => {
        this.ocupado.set(false);
        this.mostrarError(err);
      },
    });
  }

  eliminar(producto: Producto): void {
    if (this.ocupado()) return;

    const confirmado = window.confirm(
      '¿Eliminar "' + producto.nombre +
      '"? Esta acción no se puede deshacer.',
    );

    if (!confirmado) return;

    this.ocupado.set(true);
    this.error.set('');
    this.mensaje.set('');

    this.servicio.eliminar(producto.id).subscribe({
      next: () => {
        this.ocupado.set(false);
        this.mensaje.set('Producto eliminado correctamente.');
        this.cargar();
      },
      error: (err: HttpErrorResponse) => {
        this.ocupado.set(false);
        this.mostrarError(err);
      },
    });
  }

  private productoVacio(): Omit<Producto, 'id'> {
    return {
      sku: '',
      nombre: '',
      categoria: '',
      precio: 1,
      stock: 0,
    };
  }

  private mostrarError(err: HttpErrorResponse): void {
    this.mensaje.set('');

    if (err.status === 401) {
      this.error.set(
        'La API rechazó la autenticación. Revisa la sesión.',
      );
    } else if (err.status === 403) {
      this.error.set(
        'La API no permitió la operación. Hay que revisar el rol y las rutas.',
      );
    } else {
      this.error.set(
        'No se completó la operación. Código HTTP: ' +
        err.status + '.',
      );
    }
  }
}