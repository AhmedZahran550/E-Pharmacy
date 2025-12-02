import { IsLocalizedName } from '@/common/decorators/localized-name.decorator';
import { LocalizedName } from '@/common/models/localized.name';
import { ApiProperty } from '@nestjs/swagger';
import {
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';
export class CreateServiceDto {
  @IsLocalizedName()
  localizedName: LocalizedName;

  @ApiProperty()
  @IsString()
  @MaxLength(2000)
  @IsOptional()
  description: string;

  @ApiProperty()
  @IsOptional()
  @IsNumber()
  price: number;

  @IsNotEmpty()
  specialityId: string;
}
