import { PartialType } from '@nestjs/swagger';
import { CreateOrderDto, CreateOrderItemDto } from './create-order.dto';
import {
  IsArray,
  IsEnum,
  IsNumber,
  IsOptional,
  IsUUID,
  Min,
  ValidateNested,
} from 'class-validator';
import { OrderStatus, OrderType } from '@/database/entities/order.entity';
import { Type } from 'class-transformer';

export class UpdateOrderDto {
  @IsOptional()
  @IsEnum(OrderStatus)
  status: OrderStatus;

  @IsOptional()
  @IsEnum(OrderType)
  type: OrderType;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateOrderItemDto)
  items: CreateOrderItemDto[];
}
