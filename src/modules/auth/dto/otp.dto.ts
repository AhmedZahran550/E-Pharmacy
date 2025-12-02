import { IsBoolean, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class SendOTPDto {
  @IsString()
  @IsNotEmpty()
  mobile: string;

  @IsOptional()
  @IsBoolean()
  existingUser?: boolean;
}

export class VerifyOTPDto {
  @IsString()
  @IsNotEmpty()
  mobile: string;

  @IsString()
  @IsNotEmpty()
  otp: string;
}
