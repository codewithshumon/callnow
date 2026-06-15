import {
  IsString,
  IsOptional,
  IsArray,
  Matches,
  IsISO8601,
  MaxLength,
} from 'class-validator';

export class SendMessageDto {
  @IsString()
  @Matches(/^\+[1-9]\d{1,14}$/, { message: 'fromNumber must be E.164 format' })
  fromNumber: string;

  @IsString()
  @Matches(/^\+[1-9]\d{1,14}$/, { message: 'toNumber must be E.164 format' })
  toNumber: string;

  @IsString()
  @MaxLength(1600)
  body: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  mediaUrls?: string[];

  @IsOptional()
  @IsISO8601()
  scheduledAt?: string;
}
