import {
  IsBoolean,
  IsEnum,
  IsInt,
  IsLatitude,
  IsLocale,
  IsLongitude,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Max,
  Min,
  MinLength,
  ValidateIf,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

export enum PlacesNearbyRanking {
  PROMINENCE = 'prominence',
  DISTANCE = 'distance',
}

export class GooglePlacesNearbySearchDto {
  @IsNumber()
  @Type(() => Number)
  @IsLatitude()
  lat: number;

  @IsNumber()
  @Type(() => Number)
  @IsLongitude()
  lng: number;

  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(50000)
  @IsOptional() // Make it optional so it can be undefined for rankby=distance
  radius?: number;

  @ValidateIf((o) => !o.pagetoken) // Only validate if pagetoken is NOT present
  @IsEnum(PlacesNearbyRanking)
  @ValidateIf((o) => o.radius !== undefined)
  @IsOptional()
  rankby?: PlacesNearbyRanking;

  @ValidateIf((o) => !o.pagetoken)
  @IsOptional()
  @IsString()
  @MinLength(1)
  keyword?: string;

  @ValidateIf((o) => !o.pagetoken)
  @IsOptional()
  @IsLocale()
  language?: string;

  @ValidateIf((o) => !o.pagetoken)
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  @Max(4)
  @ValidateIf((o) => o.maxprice !== undefined)
  minprice?: number;

  @ValidateIf((o) => !o.pagetoken)
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  @Max(4)
  maxprice?: number;

  /**
   * Deprecated. Use 'keyword' instead.
   */
  @ValidateIf((o) => !o.pagetoken)
  @IsOptional()
  @IsString()
  @MinLength(1)
  name?: string;

  @ValidateIf((o) => !o.pagetoken)
  @IsOptional()
  @Type(() => Boolean) // Handles "true" or "false" strings
  @IsBoolean()
  opennow?: boolean;

  @ValidateIf((o) => !o.pagetoken)
  @IsOptional()
  @IsString()
  @MinLength(2) // e.g., "cafe", "store"
  type?: string;

  @IsOptional()
  @IsString()
  @MinLength(10) // Page tokens are long and complex
  @ValidateIf((o) => o.location !== undefined) // If location is present...
  pagetoken?: string;
}

export class PlaceDto {
  longitude: number;
  latitude: number;
  range: number;
}
