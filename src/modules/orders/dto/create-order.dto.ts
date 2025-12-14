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

  @IsOptional()
  @IsNumber()
  unitPrice: number;
}

export class CreateOrderDto {
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateOrderItemDto)
  items: CreateOrderItemDto[];

  @IsUUIDObj()
  branch: UUIDObject;

  @IsEnum(OrderType)
  type: OrderType;
}
