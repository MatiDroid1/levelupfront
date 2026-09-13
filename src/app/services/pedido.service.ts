import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { NuevoPedido, Pedido } from '../models/pedido';

@Injectable({ providedIn: 'root' })
export class PedidoService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = environment.apiPedidos;

  listar(usuario?: string): Observable<Pedido[]> {
    let params = new HttpParams();
    if (usuario) params = params.set('usuario', usuario);
    return this.http.get<Pedido[]>(this.baseUrl, { params });
  }

  obtener(id: number): Observable<Pedido> {
    return this.http.get<Pedido>(`${this.baseUrl}/${id}`);
  }

  crear(pedido: NuevoPedido): Observable<Pedido> {
    return this.http.post<Pedido>(this.baseUrl, pedido);
  }

  cambiarEstado(id: number, estado: string): Observable<Pedido> {
    return this.http.patch<Pedido>(`${this.baseUrl}/${id}/estado`, { estado });
  }
}
