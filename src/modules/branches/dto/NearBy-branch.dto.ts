import { PaginationDto } from '@/dtos/pagination.dto';
import { Transform, Type } from 'class-transformer';
import {
  IsArray,
  IsEnum,
  IsNumber,
  IsObject,
  IsOptional,
  IsString,
  Max,
  Min,
  ValidateIf,
  ValidateNested,
} from 'class-validator';

enum SortOrder {
  ASC = 'ASC',
  DESC = 'DESC',
}
enum availabilityStatus {
  OPENED = 'opened',
  CLOSED = 'closed',
}

export enum SortBy {
  distance = 'distance',
  total_price = 'price',
  name_en = 'name_en',
  name_ar = 'name_ar',
}

export class NearByBranchDto extends PaginationDto {
  @IsNumber()
  @ValidateIf((o) => o.sortBy === SortBy.distance)
  latitude: number;

  @IsNumber()
  @ValidateIf((o) => o.sortBy === SortBy.distance)
  longitude: number;

  @IsOptional()
  @IsNumber()
  @Min(1000)
  // @Max(100000)
  radius: number = 50000;

  @IsString()
  type: string;

  @IsOptional()
  @IsEnum(availabilityStatus)
  availabilityStatus: availabilityStatus;

  @IsOptional()
  @IsString()
  search: string;

  @IsOptional()
  @IsString()
  providerId: string;

  @IsOptional()
  @Transform(({ value }) => value.split(','))
  @IsArray()
  serviceIds: string[];

  @IsOptional()
  @IsEnum(SortBy)
  sortBy: SortBy = SortBy.distance;

  @IsOptional()
  @IsEnum(SortOrder)
  sortOrder: SortOrder = SortOrder.ASC;

  @ValidateIf((o) => !o.latitude || !o.longitude)
  @IsString()
  cityId: string;

  @IsOptional()
  @IsString()
  areaId: string;

  @IsOptional()
  @IsString()
  specialityId: string;

  @IsOptional()
  @IsNumber()
  limit: number = 100;
}
