import { IsEnum, IsOptional, IsString } from 'class-validator';

export enum UserActionType {
  SOFT_DELETE = 'SOFT_DELETE',
  RESTORE = 'RESTORE',
  ENABLE = 'ENABLE',
  DISABLE = 'DISABLE',
}

export class UserActionDto {
  @IsEnum(UserActionType)
  type: UserActionType;
  @IsString()
  @IsOptional()
  reason?: string;
}
