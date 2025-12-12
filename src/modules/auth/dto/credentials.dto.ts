import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsEnum,
  IsJWT,
  IsNotEmpty,
  IsOptional,
  IsString,
  Matches,
  ValidateIf,
  ValidateNested,
} from 'class-validator';

export enum GrantType {
  PASSWORD = 'password',
  GUEST = 'guest',
  OTP = 'otp',
  REFRESH_TOKEN = 'refresh_token',
}

export enum Client {
  MOBILE_APP = 'mobile_app',
  PORTAL = 'portal',
}

export class DeviceInfo {
  @IsString()
  @IsNotEmpty()
  brand: string;

  @IsString()
  @IsNotEmpty()
  deviceType: string;

  @IsString()
  @IsOptional()
  osVersion?: string;
}

export const GrantTypes = Object.values(GrantType);

export class CredentialsDto {
  @ApiProperty()
  @IsNotEmpty()
  @IsEnum(GrantType, { each: true })
  grant_type: GrantType;

  @ApiProperty()
  @ValidateIf((o) => o.grant_type === 'password')
  @IsString()
  @IsNotEmpty()
  username: string;

  @ApiProperty()
  @ValidateIf((o) => o.grant_type === 'otp')
  @IsString()
  @Matches(/^\d{6}$/)
  otp: string;

  @ApiProperty()
  @ValidateIf((o) => o.grant_type === 'otp')
  @IsString()
  @IsNotEmpty()
  mobile: string;

  @ApiProperty()
  @ValidateIf((o) => o.grant_type === 'password')
  @IsString()
  @IsNotEmpty()
  password: string;

  @ApiProperty()
  @ValidateIf((o) => o.grant_type === 'refresh_token')
  @IsJWT()
  refresh_token: string;

  @ApiProperty()
  // @ValidateIf((o) => o.grant_type === 'otp')
  @IsOptional()
  @IsString()
  device_token: string;

  @ApiProperty()
  @ValidateIf((o) => o.grant_type === 'otp')
  @ValidateNested({ each: true })
  @Type(() => DeviceInfo)
  device_info: DeviceInfo;

  @ApiProperty()
  @IsEnum(Client)
  client_id: Client;

  @ApiProperty()
  @IsString()
  @IsOptional()
  client_secret: string;
}
