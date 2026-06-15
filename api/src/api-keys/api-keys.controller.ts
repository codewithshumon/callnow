import { Controller, Get, Post, Delete, Param, Body, UseGuards } from '@nestjs/common';
import { ApiKeysService } from './api-keys.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@Controller('api-keys')
@UseGuards(JwtAuthGuard)
export class ApiKeysController {
  constructor(private readonly apiKeysService: ApiKeysService) {}

  @Post()
  async create(
    @CurrentUser('id') userId: string,
    @Body('name') name: string,
    @Body('scopes') scopes?: string[],
  ) {
    return this.apiKeysService.createApiKey(userId, name, scopes);
  }

  @Get()
  async list(@CurrentUser('id') userId: string) {
    return this.apiKeysService.listApiKeys(userId);
  }

  @Delete(':id')
  async revoke(@CurrentUser('id') userId: string, @Param('id') id: string) {
    return this.apiKeysService.revokeApiKey(userId, id);
  }
}
