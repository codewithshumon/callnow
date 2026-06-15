import { IsString, IsOptional, IsInt, Min, Max, IsArray, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

class ContactCsvRow {
  @IsString()
  phone: string;

  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  notes?: string;
}

export class CreateCampaignDto {
  @IsString()
  name: string;

  @IsString()
  fromNumber: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(10)
  concurrency?: number = 1;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  @Max(60)
  delaySeconds?: number = 0;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  @Max(3)
  retryMax?: number = 0;

  @IsOptional()
  @IsString()
  voicemailDropUrl?: string;

  @IsOptional()
  @IsString()
  callingHoursStart?: string; // HH:MM

  @IsOptional()
  @IsString()
  callingHoursEnd?: string; // HH:MM

  @IsOptional()
  @IsString()
  callingHoursTimezone?: string; // IANA

  @IsOptional()
  @IsString()
  scheduledAt?: string; // ISO 8601
}
