import { WebSocketGateway, WebSocketServer } from '@nestjs/websockets';
import type { Server } from 'socket.io';
import { Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';

@WebSocketGateway({ namespace: '/ws', cors: true })
export class CallingGateway {
  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger(CallingGateway.name);

  // 6.3.2 — Inbound call event
  @OnEvent('call:inbound')
  emitInboundCall(payload: { userId: string; callData: unknown }) {
    this.server
      .to(`user:${payload.userId}`)
      .emit('call:inbound', { event: 'call:inbound', data: payload.callData });
  }

  // 6.3.3 — Call status update
  @OnEvent('call:status')
  emitCallStatus(payload: {
    userId: string;
    callSid: string;
    status: string;
    duration?: number;
  }) {
    this.server.to(`user:${payload.userId}`).emit('call:status', {
      event: 'call:status',
      data: {
        callSid: payload.callSid,
        status: payload.status,
        duration: payload.duration,
      },
    });
  }
}
