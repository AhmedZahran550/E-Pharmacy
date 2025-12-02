import { Transform } from 'class-transformer';
import {
  ArrayNotEmpty,
  IsArray,
  IsBoolean,
  IsNumber,
  IsOptional,
} from 'class-validator';

export class UploadBranchesConfigDto {
  @IsOptional()
  @IsBoolean()
  createProviderIfNotExist: boolean;

  @IsOptional()
  @Transform(({ value }) => value.split(',').map((item) => Number(item.trim())))
  @IsArray()
  @ArrayNotEmpty()
  @IsNumber({}, { each: true })
  onlyOnRows: number[];
}
