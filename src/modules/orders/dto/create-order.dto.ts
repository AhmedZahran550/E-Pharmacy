import {
  IsArray,
  IsEnum,
  IsOptional,
  ValidateNested,
  IsUUID,
} from 'class-validator';
import { IsUUIDObj, UUIDObject } from '@/common/decorators/isObjId.decorator';
import { OrderType } from '@/database/entities/order.entity';

export class CreateOrderDto {
  @IsArray()
  @IsUUID('4', { each: true })
  items: string[];

  @IsOptional()
  @IsUUIDObj()
  branch: UUIDObject;

  @IsEnum(OrderType)
  type: OrderType;
}
