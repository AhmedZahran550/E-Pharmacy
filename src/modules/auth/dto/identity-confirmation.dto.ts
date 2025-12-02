import { IsBoolean, IsOptional, IsString } from 'class-validator';

export class IdentityConfirmationDto {
  @IsString()
  @IsOptional()
  identityId?: string;

  @IsBoolean()
  identityConfirmed: boolean;
}
