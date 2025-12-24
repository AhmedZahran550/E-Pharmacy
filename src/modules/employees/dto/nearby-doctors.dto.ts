import {
  IsNumber,
  IsOptional,
  IsBoolean,
  Min,
  Max,
  IsString,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';

export class NearbyDoctorsDto {
  @ApiProperty({
    description: 'Latitude coordinate',
    example: 30.0444,
    required: true,
  })
  @Type(() => Number)
  @IsNumber()
  @Min(-90)
  @Max(90)
  lat: number;

  @ApiProperty({
    description: 'Longitude coordinate',
    example: 31.2357,
    required: true,
  })
  @Type(() => Number)
  @IsNumber()
  @Min(-180)
  @Max(180)
  lng: number;

  @ApiProperty({
    description: 'Search radius in kilometers',
    example: 10,
    required: false,
    default: 10,
  })
  @Type(() => Number)
  @IsOptional()
  @IsNumber()
  @Min(0.1)
  @Max(100)
  radius?: number;

  @ApiProperty({
    description: 'Filter by online status',
    example: true,
    required: false,
  })
  @Type(() => Boolean)
  @IsOptional()
  @IsBoolean()
  isOnline?: boolean;

  // Pagination parameters
  @ApiProperty({
    description: 'Page number',
    example: 1,
    required: false,
    default: 1,
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  page?: number;

  @ApiProperty({
    description: 'Items per page',
    example: 20,
    required: false,
    default: 20,
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  limit?: number;

  @ApiProperty({
    description: 'Search term',
    example: 'doctor name',
    required: false,
  })
  @IsOptional()
  @IsString()
  search?: string;

  @IsOptional()
  filter?: any;

  @IsOptional()
  sortBy?: any;
}
