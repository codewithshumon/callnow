import {
  Controller,
  Get,
  Post,
  Delete,
  Param,
  Body,
  Query,
  UseGuards,
} from '@nestjs/common';
import { NumbersService } from './numbers.service';
import { SearchNumbersDto } from './dto/search-numbers.dto';
import { ProvisionNumberDto } from './dto/provision-number.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@Controller('numbers')
@UseGuards(JwtAuthGuard)
export class NumbersController {
  constructor(private readonly numbersService: NumbersService) {}

  @Get()
  async getMyNumbers(@CurrentUser('id') userId: string) {
    return this.numbersService.getMyNumbers(userId);
  }

  @Get('search')
  async searchNumbers(@Query() query: SearchNumbersDto) {
    return this.numbersService.searchAvailableNumbers(
      query.countryCode,
      query.areaCode,
      query.capabilities,
    );
  }

  @Post()
  async provisionNumber(
    @CurrentUser('id') userId: string,
    @Body() dto: ProvisionNumberDto,
  ) {
    return this.numbersService.provisionNumber(userId, dto.number);
  }

  @Delete(':id')
  async releaseNumber(
    @CurrentUser('id') userId: string,
    @Param('id') id: string,
  ) {
    return this.numbersService.releaseNumber(userId, id);
  }
}
