import { IsString } from 'class-validator';

export class UpgradePlanDto {
  @IsString()
  planId: string;
}
