import { WebSocketGateway, WebSocketServer } from '@nestjs/websockets';
import type { Server } from 'socket.io';
import { Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';

@WebSocketGateway({ namespace: '/ws', cors: true })
export class DialerGateway {
  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger(DialerGateway.name);

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
  emitCampaignComplete(payload: {
    campaignId: string;
    summary: unknown;
  }) {
    this.server.to(`campaign:${payload.campaignId}`).emit('campaign:complete', {
      event: 'campaign:complete',
      data: payload.summary,
    });
  }
}
