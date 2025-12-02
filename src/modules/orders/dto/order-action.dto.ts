import { IsUUIDObj, UUIDObject } from '@/common/decorators/isObjId.decorator';
import { IsEnum, IsOptional, IsString, ValidateIf } from 'class-validator';

export enum OrderAction {
  CONFIRM = 'CONFIRM',
  CANCEL = 'CANCEL',
  REOPEN_CANCELED = 'REOPEN_CANCELED',
  REJECT = 'REJECT',
  APPROVE = 'APPROVE',
  APPLY_PROMO = 'APPLY_PROMO',
  REMOVE_PROMO = 'REMOVE_PROMO',
  NOTIFY_USER = 'NOTIFY_USER',
}

export class OrderActionDto {
  @IsEnum(OrderAction)
  type: OrderAction;

  @ValidateIf((o) => o.type === OrderAction.REJECT)
  @IsString()
  reason: string;
  @ValidateIf(
    (o) =>
      o.type === OrderAction.APPLY_PROMO || o.type === OrderAction.REMOVE_PROMO,
  )
  @IsString()
  promoCode: string;
}
