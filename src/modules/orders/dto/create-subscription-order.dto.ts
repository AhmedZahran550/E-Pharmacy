import { PaymentMethod } from '@/database/entities/transaction.entity';
import {
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  ValidateIf,
} from 'class-validator';

export enum SubscriptionActionType {
  NEW_SUBSCRIPTION = 'new-subscription',
  RENEW_SUBSCRIPTION = 'renew-subscription',
  UPGRADE_SUBSCRIPTION = 'upgrade-subscription',
  UPDATE_SUBSCRIPTION = 'update-subscription',
  ADD_MEMBERS = 'add-members',
}

export class CreateSubscriptionOrderDto {
  @IsOptional()
  @IsString()
  appliedCode: string;

  @ValidateIf((o) => o.action !== SubscriptionActionType.ADD_MEMBERS)
  @IsOptional()
  @IsNotEmpty()
  planId: string;

  @IsNotEmpty()
  @IsEnum(PaymentMethod)
  paymentMethod: PaymentMethod;

  @IsNotEmpty()
  @IsString()
  idempotencyKey: string;

  @IsEnum(SubscriptionActionType)
  @IsOptional()
  action: SubscriptionActionType = SubscriptionActionType.NEW_SUBSCRIPTION;
}
