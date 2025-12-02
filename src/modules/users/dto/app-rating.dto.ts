import { RatingAction } from '@/database/entities/app-rating.entity';
import { UUIDObject } from '@/common/decorators/isObjId.decorator';
import {
  IsEnum,
  IsNumber,
  IsOptional,
  IsString,
  Max,
  Min,
  Validate,
  ValidateIf,
} from 'class-validator';

export class RatingDto {
  @ValidateIf((r) => r.action === RatingAction.RATE)
  @IsNumber()
  @Min(1)
  @Max(5)
  rating: number;

  @IsEnum(RatingAction)
  action: RatingAction;

  @IsOptional()
  @IsString()
  notes: string;

  user: UUIDObject;
}
