import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import type { Server, Socket } from 'socket.io';
import { Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';

@WebSocketGateway({ namespace: '/ws', cors: true })
export class DialerGateway
  implements OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger(DialerGateway.name);

  constructor(
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  // 8.5.2 — Verify JWT on connect (skips if already authenticated by MessagingGateway)
  async handleConnection(client: Socket) {
    const existingUserId = (client as unknown as Record<string, unknown>).userId;
    if (existingUserId) {
      this.logger.log(`Dialer WS: user ${existingUserId} already authenticated`);
      return;
    }

    try {
      const token =
        client.handshake.auth?.token ||
        client.handshake.headers?.authorization?.replace('Bearer ', '');

      if (!token) {
        this.logger.warn(`Dialer WS: no token from ${client.id}`);
        client.disconnect();
        return;
      }

      const payload = this.jwtService.verify(token, {
        secret:
          this.configService.get<string>('jwt.accessSecret') || 'change-me',
      });

      const userId = payload.sub;
      if (!userId) {
        client.disconnect();
        return;
      }

      (client as unknown as Record<string, unknown>).userId = userId;
      this.logger.log(`Dialer WS: user ${userId} connected (${client.id})`);
    } catch {
      this.logger.warn(`Dialer WS auth failed: ${client.id}`);
      client.disconnect();
    }
  }

  handleDisconnect(client: Socket) {
    this.logger.log(`Dialer WS: client ${client.id} disconnected`);
  }

  // 8.5.3 — Client subscribes to campaign room
  @SubscribeMessage('campaign:subscribe')
  handleCampaignSubscribe(client: Socket, payload: { campaignId: string }) {
    if (payload?.campaignId) {
      client.join(`campaign:${payload.campaignId}`);
      this.logger.log(
        `Client ${client.id} joined campaign:${payload.campaignId}`,
      );
    }
  }

  // 8.5.4 — Campaign progress
  @OnEvent('campaign:progress')
  emitCampaignProgress(payload: {
    campaignId: string;
    dialed: number;
    answered: number;
    failed: number;
    remaining: number;
  }) {
    this.server.to(`campaign:${payload.campaignId}`).emit('campaign:progress', {
      event: 'campaign:progress',
      data: payload,
    });
  }

  // 8.5.5 — Campaign complete
  @OnEvent('campaign:complete')
  emitCampaignComplete(payload: { campaignId: string; summary: unknown }) {
    this.server.to(`campaign:${payload.campaignId}`).emit('campaign:complete', {
      event: 'campaign:complete',
      data: payload.summary,
    });
  }
}
