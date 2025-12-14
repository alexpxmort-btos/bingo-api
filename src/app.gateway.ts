import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
  MessageBody,
  ConnectedSocket,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Logger } from '@nestjs/common';

@WebSocketGateway({
  cors: {
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    credentials: true,
  },
})
export class AppGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private logger: Logger = new Logger('AppGateway');

  handleConnection(client: Socket) {
    this.logger.log(`Cliente conectado: ${client.id}`);
  }

  handleDisconnect(client: Socket) {
    this.logger.log(`Cliente desconectado: ${client.id}`);
  }

  @SubscribeMessage('join-room')
  handleJoinRoom(
    @MessageBody() data: { roomCode: string; visitorId: string },
    @ConnectedSocket() client: Socket,
  ) {
    client.join(data.roomCode);
    this.logger.log(`Cliente ${client.id} entrou na sala ${data.roomCode}`);
    return { event: 'joined-room', data: { roomCode: data.roomCode } };
  }

  @SubscribeMessage('leave-room')
  handleLeaveRoom(
    @MessageBody() data: { roomCode: string },
    @ConnectedSocket() client: Socket,
  ) {
    client.leave(data.roomCode);
    this.logger.log(`Cliente ${client.id} saiu da sala ${data.roomCode}`);
    return { event: 'left-room', data: { roomCode: data.roomCode } };
  }

  emitToRoom(roomCode: string, event: string, data: any) {
    this.server.to(roomCode).emit(event, data);
  }
}

