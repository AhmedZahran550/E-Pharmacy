import {
  IsNumber,
  IsOptional,
  IsString,
  Max,
  ValidateIf,
} from 'class-validator';

export class GlobalSearchDto {
  @IsNumber()
  @IsOptional()
  latitude: number;

  @IsNumber()
  @IsOptional()
  longitude: number;

  @IsString()
  search: string;

  @ValidateIf((o) => !o.latitude || !o.longitude)
  @IsString()
  cityId: string;

  @IsNumber()
  @IsOptional()
  @Max(50)
  limitPerType: number = 20;
}
