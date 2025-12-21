import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsNumber, IsOptional, Max, Min, IsString } from 'class-validator';

export class NearbyBranchesDto {
  @ApiProperty({
    description: 'User latitude',
    example: 30.0444,
    required: true,
  })
  @Type(() => Number)
  @IsNumber()
  @Min(-90)
  @Max(90)
  lat: number;

  @ApiProperty({
    description: 'User longitude',
    example: 31.2357,
    required: true,
  })
  @Type(() => Number)
  @IsNumber()
  @Min(-180)
  @Max(180)
  lng: number;

  @ApiProperty({
    description: 'Search radius in kilometers (default: 10km)',
    example: 10,
    required: false,
    default: 10,
  })
  @Type(() => Number)
  @IsNumber()
  @IsOptional()
  @Min(0.1)
  @Max(100)
  radius?: number = 10;

  // Allow pagination parameters to pass through
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  page?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  limit?: number;

  @IsOptional()
  @IsString()
  search?: string;

  @IsOptional()
  filter?: any;

  @IsOptional()
  sortBy?: any;
}
