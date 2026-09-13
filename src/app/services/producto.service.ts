import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { Producto } from '../models/producto';

@Injectable({ providedIn: 'root' })
export class ProductoService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = environment.apiProductos;

  listar(categoria?: string): Observable<Producto[]> {
    let params = new HttpParams();
    if (categoria) params = params.set('categoria', categoria);
    return this.http.get<Producto[]>(this.baseUrl, { params });
  }

  obtener(id: number): Observable<Producto> {
    return this.http.get<Producto>(`${this.baseUrl}/${id}`);
  }

  crear(producto: Omit<Producto, 'id'>): Observable<Producto> {
    return this.http.post<Producto>(this.baseUrl, producto);
  }

  eliminar(id: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/${id}`);
  }
}
