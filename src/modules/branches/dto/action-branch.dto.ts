import { IsEnum, IsOptional, IsString } from 'class-validator';

export enum BranchActionType {
  SOFT_DELETE = 'SOFT_DELETE',
  RESTORE = 'RESTORE',
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE',
}

export class BranchActionDto {
  @IsEnum(BranchActionType)
  type: BranchActionType;
  @IsOptional()
  @IsString()
  reason?: string;
}
