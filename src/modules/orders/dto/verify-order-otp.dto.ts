import { IsString, Length } from 'class-validator';

export class VerifyOrderOtpDto {
  @IsString()
  @Length(6, 6)
  otp: string;
}
