import {
  Controller,
  Get,
  Post,
  Param,
  Body,
  Query,
  UseGuards,
  UseInterceptors,
  UploadedFile,
  Res,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import type { Response } from 'express';
import { DialerService } from './dialer.service';
import { CreateCampaignDto } from './dto/create-campaign.dto';
import { CampaignQueryDto } from './dto/campaign-query.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@Controller()
@UseGuards(JwtAuthGuard)
export class DialerController {
  constructor(private readonly dialerService: DialerService) {}

  @Get('campaigns')
  async listCampaigns(
    @CurrentUser('id') userId: string,
    @Query() query: CampaignQueryDto,
  ) {
    return this.dialerService.listCampaigns(userId, query.page, query.limit);
  }

  @Post('campaigns')
  @UseInterceptors(FileInterceptor('contacts'))
  async createCampaign(
    @CurrentUser('id') userId: string,
    @Body() dto: CreateCampaignDto,
    @UploadedFile() file: Express.Multer.File,
  ) {
    if (!file) {
      throw new Error('CSV file (contacts) is required');
    }
    return this.dialerService.createCampaign(userId, dto, file.buffer);
  }

  @Get('campaigns/:id')
  async getCampaign(
    @CurrentUser('id') userId: string,
    @Param('id') id: string,
  ) {
    return this.dialerService.getCampaign(userId, id);
  }

  @Post('campaigns/:id/start')
  async startCampaign(
    @CurrentUser('id') userId: string,
    @Param('id') id: string,
  ) {
    return this.dialerService.startCampaign(userId, id);
  }

  @Post('campaigns/:id/pause')
  async pauseCampaign(
    @CurrentUser('id') userId: string,
    @Param('id') id: string,
  ) {
    return this.dialerService.pauseCampaign(userId, id);
  }

  @Post('campaigns/:id/resume')
  async resumeCampaign(
    @CurrentUser('id') userId: string,
    @Param('id') id: string,
  ) {
    return this.dialerService.resumeCampaign(userId, id);
  }

  @Post('campaigns/:id/stop')
  async stopCampaign(
    @CurrentUser('id') userId: string,
    @Param('id') id: string,
  ) {
    return this.dialerService.stopCampaign(userId, id);
  }

  @Get('campaigns/:id/results')
  async getResults(
    @CurrentUser('id') userId: string,
    @Param('id') id: string,
    @Query() query: CampaignQueryDto,
  ) {
    return this.dialerService.getCampaignResults(
      userId,
      id,
      query.page,
      query.limit,
    );
  }

  @Get('campaigns/:id/export')
  async exportCampaign(
    @CurrentUser('id') userId: string,
    @Param('id') id: string,
    @Res() res: Response,
  ) {
    const csv = await this.dialerService.exportCampaignResults(userId, id);
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="campaign-${id}.csv"`,
    );
    res.send(csv);
  }

  // --- DNC Management ---
  @Post('dnc')
  async addDnc(
    @CurrentUser('id') userId: string,
    @Body('phone') phone: string,
  ) {
    return this.dialerService.addDnc(userId, phone);
  }

  @Get('dnc')
  async listDnc(
    @CurrentUser('id') userId: string,
    @Query() query: CampaignQueryDto,
  ) {
    return this.dialerService.listDnc(userId, query.page, query.limit);
  }

  @Post('dnc/:id')
  async removeDnc(
    @CurrentUser('id') userId: string,
    @Param('id') id: string,
  ) {
    return this.dialerService.removeDnc(userId, id);
  }
}
