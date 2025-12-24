import { IsEmail, IsEnum, IsString, MinLength } from 'class-validator';
import { Client } from './credentials.dto';

export class RequestPasswordResetDto {
  @IsEmail()
  email: string;

  @IsEnum(Client)
  client_id: Client;
}

export class ResetPasswordDto {
  @IsString()
  token: string;

  @IsString()
  @MinLength(8)
  newPassword: string;

  @IsEnum(Client)
  client_id: Client;
}
