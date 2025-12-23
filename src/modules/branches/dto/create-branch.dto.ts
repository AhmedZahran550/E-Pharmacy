import { IsUUIDObj } from '@/common/decorators/isObjId.decorator';
import { IsLocalizedName } from '@/common/decorators/localized-name.decorator';
import { LocalizedName } from '@/common/models/localized.name';
import {
  IsArray,
  IsBoolean,
  IsLatitude,
  IsLongitude,
  IsNumber,
  IsOptional,
  IsPositive,
  IsString,
} from 'class-validator';

export class CreateBranchDto {
  // add construction with partial to allow partial updates
  constructor(partial?: Partial<CreateBranchDto>) {
    Object.assign(this, partial);
  }
  @IsLocalizedName()
  localizedName: LocalizedName;

  @IsLocalizedName()
  address: LocalizedName;

  @IsLatitude()
  latitude: number;

  @IsLongitude()
  longitude: number;

  @IsUUIDObj()
  city: {
    id?: string;
  };

  @IsArray()
  telephones: string[];

  @IsOptional()
  @IsArray()
  images?: string[];

  @IsOptional()
  @IsString()
  whatsAppTelephone: string;

  @IsOptional()
  @IsBoolean()
  isActive: boolean;

  @IsOptional()
  @IsBoolean()
  isAlwaysOpen?: boolean;

  @IsOptional()
  @IsNumber()
  @IsPositive()
  maxEmployees?: number;

  @IsOptional()
  @IsUUIDObj()
  provider: {
    id?: string;
  };
}
