export interface Notificacion {
  id: number;
  pedidoId: number;
  estado: string;
  mensaje: string;
  fecha: string;
  leida: boolean;
}