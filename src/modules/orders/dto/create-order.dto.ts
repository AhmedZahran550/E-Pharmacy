import { Type } from 'class-transformer';
import {
  IsArray,
  IsEnum,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  Min,
  ValidateNested,
} from 'class-validator';
import { IsUUIDObj, UUIDObject } from '@/common/decorators/isObjId.decorator';
import { OrderType } from '@/database/entities/order.entity';

export class CreateOrderItemDto {
  @IsUUID('4')
  id: string;

  @IsNumber()
  @Min(1)
  quantity: number;

  @IsNumber()
  @Min(0)
  unitPrice: number;
}

export class CreateOrderDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateOrderItemDto)
  items: CreateOrderItemDto[];

  @IsOptional()
  @IsUUIDObj()
  branch: UUIDObject;

  @IsEnum(OrderType)
  type: OrderType;
}
