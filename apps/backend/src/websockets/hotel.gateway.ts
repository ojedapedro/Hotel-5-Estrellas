import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Logger } from '@nestjs/common';

@WebSocketGateway({
  cors: {
    origin: '*',
  },
})
export class HotelGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server!: Server;

  private readonly logger = new Logger(HotelGateway.name);

  handleConnection(client: Socket) {
    this.logger.log(`Cliente conectado WebSocket: ${client.id}`);
  }

  handleDisconnect(client: Socket) {
    this.logger.log(`Cliente desconectado WebSocket: ${client.id}`);
  }

  @SubscribeMessage('join_room')
  handleJoinRoom(client: Socket, room: string) {
    client.join(room);
    this.logger.log(`Cliente ${client.id} se unió a sala ${room}`);
  }

  /**
   * Notifica a recepción y gerencia el cambio de estado de una habitación
   */
  emitRoomStatusChange(habitacionId: string, numero: string, nuevoEstado: string) {
    if (this.server) {
      this.server.emit('room_status_changed', {
        habitacionId,
        numero,
        nuevoEstado,
        timestamp: new Date().toISOString(),
      });
    }
  }

  /**
   * Notifica a la cocina cuando hay un nuevo pedido o comanda
   */
  emitNewKitchenOrder(comanda: any) {
    if (this.server) {
      this.server.emit('kitchen_new_order', comanda);
    }
  }

  /**
   * Notifica alerta de inventario bajo
   */
  emitLowStockAlert(articulo: any) {
    if (this.server) {
      this.server.emit('low_stock_alert', articulo);
    }
  }
}
