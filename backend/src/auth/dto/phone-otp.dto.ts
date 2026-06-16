import { IsString, IsIn, IsOptional } from 'class-validator';

export class PhoneOtpDto {
  @IsString()
  phone: string; // E.164

  @IsString()
  @IsIn(['request', 'verify'])
  action: 'request' | 'verify';

  @IsString()
  @IsOptional()
  code?: string; // required when action = 'verify'
}
