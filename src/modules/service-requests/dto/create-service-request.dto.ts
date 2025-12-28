import { IsUUIDObj, UUIDObject } from '@/common/decorators/isObjId.decorator';
import { ServiceRequestType } from '@/database/entities/service-request.entity';
import { Type } from 'class-transformer';
import {
  IsArray,
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  Min,
  ValidateNested,
} from 'class-validator';

export class SelectedItemDto {
  @IsUUID()
  @IsNotEmpty()
  id: string;

  @IsNumber()
  @Min(1)
  quantity: number;
}

export class ManualItemDto {
  @IsString()
  @IsNotEmpty()
  medicineName: string;

  @IsNumber()
  @IsOptional()
  quantity?: number;
}

export class CreateServiceRequestDto {
  @IsUUIDObj()
  branch: UUIDObject;

  @IsEnum(ServiceRequestType)
  @IsNotEmpty()
  type: ServiceRequestType;

  @IsArray()
  @IsOptional()
  @ValidateNested({ each: true })
  @Type(() => SelectedItemDto)
  selectedItems?: SelectedItemDto[];

  @IsArray()
  @IsOptional()
  @ValidateNested({ each: true })
  @Type(() => ManualItemDto)
  manualItems?: ManualItemDto[];

  @IsString()
  @IsOptional()
  notes?: string;
}
