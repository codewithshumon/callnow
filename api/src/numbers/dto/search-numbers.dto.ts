import { IsOptional, IsString } from 'class-validator';

export class SearchNumbersDto {
  @IsString()
  countryCode: string;

  @IsOptional()
  @IsString()
  areaCode?: string;

  @IsOptional()
  @IsString()
  capabilities?: string; // comma-separated: 'voice,sms'
}
