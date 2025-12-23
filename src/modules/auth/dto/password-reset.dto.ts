import { IsEmail, IsEnum, IsString, MinLength } from 'class-validator';

export enum ClientType {
  USER = 'user',
  EMPLOYEE = 'employee',
}

export class RequestPasswordResetDto {
  @IsEmail()
  email: string;

  @IsEnum(ClientType)
  client_id: ClientType;
}

export class ResetPasswordDto {
  @IsString()
  token: string;

  @IsString()
  @MinLength(8)
  newPassword: string;

  @IsEnum(ClientType)
  client_id: ClientType;
}
