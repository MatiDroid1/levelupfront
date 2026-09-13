export interface DetallePedido {
  id?: number;
  productoId: number;
  nombreProducto: string;
  precioUnitario: number;
  cantidad: number;
  subtotal?: number;
}

export interface Pedido {
  id?: number;
  usuario: string;
  fecha?: string;
  estado?: string;
  total?: number;
  detalles: DetallePedido[];
}

/** Lo que el front envía al POST /pedidos */
export interface NuevoPedido {
  usuario: string;
  detalles: Pick<DetallePedido, 'productoId' | 'nombreProducto' | 'precioUnitario' | 'cantidad'>[];
}
