import { IsString, Matches } from 'class-validator';

export class ProvisionNumberDto {
  @IsString()
  @Matches(/^\+[1-9]\d{1,14}$/, { message: 'Number must be in E.164 format' })
  number: string;
}
