import { PartialType } from '@nestjs/swagger';
import { CreateOrderDto } from './create-order.dto';
import { IsNumber } from 'class-validator';
import { IsUUIDObj, UUIDObject } from '@/common/decorators/isObjId.decorator';

export class UpdateOrderDto extends PartialType(CreateOrderDto) {}
export class UpdateOrderCoverageDto {
  @IsNumber()
  coverageAmount: number;
}

export class OrderPaymentRequestDto {
  @IsUUIDObj()
  user: UUIDObject;
}
