import { IsUUIDObj, UUIDObject } from '@/common/decorators/isObjId.decorator';
import { DayOfWeek } from '@/database/entities/branch-availability.entity';
import { Type } from 'class-transformer';
import {
  IsNotEmpty,
  IsOptional,
  IsBoolean,
  IsString,
  Matches,
  IsEnum,
  ValidateNested,
  IsArray,
  IsUUID,
  ValidateIf,
  ArrayMinSize,
} from 'class-validator';

export class CreateBranchAvailabilityDto {
  @IsNotEmpty()
  @IsString()
  @IsEnum(DayOfWeek)
  dayOfWeek: DayOfWeek;

  @IsString()
  @Matches(/^(0[0-9]|1[0-9]|2[0-3]):[0-5][0-9](:[0-5][0-9])?$/, {
    message: 'Time must be in HH:mm or HH:mm:ss format',
  })
  openingTime?: string;

  @IsString()
  @Matches(/^(0[0-9]|1[0-9]|2[0-4]):[0-5][0-9](:[0-5][0-9])?$/, {
    message: 'Time must be in HH:mm or HH:mm:ss format',
  })
  closingTime?: string;

  branch: UUIDObject;

  @IsOptional()
  @IsUUID()
  id: string;
}
export class AvailabilityListDto {
  @ValidateIf((o) => !o.isAlwaysOpen)
  @ValidateNested({ each: true })
  @Type(() => CreateBranchAvailabilityDto)
  @IsArray()
  @IsNotEmpty({ each: true })
  @ArrayMinSize(1)
  daysOfWeek?: CreateBranchAvailabilityDto[];

  @IsOptional()
  @IsBoolean()
  isAlwaysOpen?: boolean;
}
