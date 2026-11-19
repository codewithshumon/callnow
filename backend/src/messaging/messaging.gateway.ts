import {
  WebSocketGateway,
  WebSocketServer,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import type { Server, Socket } from 'socket.io';
import { Logger } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { OnEvent } from '@nestjs/event-emitter';

/**
 * Messaging WebSocket gateway at /ws.
 *
 * Rooms: user:{userId} for per-user events.
 * Events: message:new, message:status
 *
 * Ref: SDD §3.3, SDD §6.1, API §WebSocket Events
 */
@WebSocketGateway({
  namespace: '/ws',
  cors: {
    origin: (
      process.env.CORS_ORIGIN ||
      'http://localhost:3000,http://localhost:8000,http://localhost:3001'
    )
      .split(',')
      .map((o) => o.trim()),
    credentials: true,
  },
})
export class MessagingGateway
  implements OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger(MessagingGateway.name);

  constructor(
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  // 5.3.2 — Authenticate on connect
  async handleConnection(client: Socket) {
    try {
      const token =
        client.handshake.auth?.token ||
        client.handshake.headers?.authorization?.replace('Bearer ', '');

      if (!token) {
        this.logger.warn(`WebSocket: no token from ${client.id}`);
        client.disconnect();
        return;
      }

      const payload = this.jwtService.verify(token, {
        secret:
          this.configService.get<string>('jwt.accessSecret') || 'change-me',
      });

      // Reject partial 2FA login tokens
      if (payload.step === '2fa') {
        this.logger.warn(`WebSocket: rejected 2FA login token from ${client.id}`);
        client.disconnect();
        return;
      }

      const userId = payload.sub;
      if (!userId) {
        client.disconnect();
        return;
      }

      // Join user's private room
      client.join(`user:${userId}`);
      (client as unknown as Record<string, unknown>).userId = userId;

      this.logger.log(`WebSocket: user ${userId} connected (${client.id})`);
    } catch (error) {
      this.logger.warn(`WebSocket auth failed: ${client.id}`);
      client.disconnect();
    }
  }

  handleDisconnect(client: Socket) {
    this.logger.log(`WebSocket: client ${client.id} disconnected`);
  }

  // 5.3.3 — Emit new message to user's room
  @OnEvent('message:new')
  emitNewMessage(payload: { userId: string; message: unknown }) {
    this.server
      .to(`user:${payload.userId}`)
      .emit('message:new', { event: 'message:new', data: payload.message });
  }

  // 5.3.4 — Emit message status update
  @OnEvent('message:status')
  emitMessageStatus(payload: {
    userId: string;
    messageId: string;
    status: string;
  }) {
    this.server.to(`user:${payload.userId}`).emit('message:status', {
      event: 'message:status',
      data: { messageId: payload.messageId, status: payload.status },
    });
  }
}
