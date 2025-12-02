import { IsUUIDObj, UUIDObject } from '@/common/decorators/isObjId.decorator';
import { Type } from 'class-transformer';
import {
  IsArray,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  Max,
  Min,
  ValidateIf,
  ValidateNested,
} from 'class-validator';

export class ItemRating {
  @IsUUID()
  itemId: string;
  @IsInt()
  @Min(1)
  @Max(5)
  rating: number;
}

export class BranchRatingDto {
  @IsNotEmpty()
  @IsInt()
  @Min(1)
  @Max(5)
  rating: number;

  @ValidateIf((o) => o.rating == 1)
  @IsNotEmpty()
  @IsString()
  notes?: string;

  @IsArray()
  @IsOptional()
  @ValidateIf((o) => o.order?.id)
  @ValidateNested({ each: true })
  @Type(() => ItemRating)
  itemsRating: ItemRating[];

  branch: UUIDObject;

  @IsUUIDObj()
  @IsOptional()
  order: UUIDObject;
}
