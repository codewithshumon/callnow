import { Controller, Get, Post, Param, Body, UseGuards } from '@nestjs/common';
import { BillingService } from './billing.service';
import { UpgradePlanDto } from './dto/upgrade-plan.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@Controller('billing')
@UseGuards(JwtAuthGuard)
export class BillingController {
  constructor(private readonly billingService: BillingService) {}

  @Get('usage')
  async getUsage(@CurrentUser('id') userId: string) {
    return this.billingService.getCurrentUsage(userId);
  }

  @Get('invoices')
  async getInvoices(@CurrentUser('id') userId: string) {
    return this.billingService.getInvoices(userId);
  }

  @Post('upgrade')
  async upgradePlan(
    @CurrentUser('id') userId: string,
    @Body() dto: UpgradePlanDto,
  ) {
    return this.billingService.upgradePlan(userId, dto.planId);
  }
}
