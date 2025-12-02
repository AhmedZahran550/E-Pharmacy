import { IsUUIDObj, UUIDObject } from '@/common/decorators/isObjId.decorator';
import { MetadataDto } from '@/common/dto/metadata.dto';
import { IsUniqeTypeConstraint } from '@/common/validators/options-types.validator';
import { PayerType } from '@/database/entities/payment.entity';
import {
  TransactionType,
  PaymentMethod,
} from '@/database/entities/transaction.entity';
import { Type } from 'class-transformer';
import {
  IsArray,
  IsEnum,
  IsNotEmpty,
  IsNotEmptyObject,
  IsNumber,
  IsObject,
  IsOptional,
  IsString,
  IsUUID,
  Validate,
  ValidateIf,
  ValidateNested,
} from 'class-validator';

export class PaymentDetailDto {}

export class Option {
  @ValidateIf((o) => o.type === TransactionType.ONLINE_PAYMENT)
  @IsNotEmpty()
  @IsEnum(PaymentMethod)
  paymentMethod?: PaymentMethod;

  @IsNumber()
  amount: number;

  @IsNotEmpty()
  @IsEnum(TransactionType)
  type: TransactionType;
}

export class CreateOrderPaymentsDto {
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  promoCode?: string;

  @IsArray()
  @IsNotEmpty()
  @ValidateNested({ each: true })
  @Type(() => Option)
  @Validate(IsUniqeTypeConstraint)
  options: Option[];

  @IsNotEmpty()
  @IsString()
  idempotencyKey: string;

  @IsOptional()
  metadata?: MetadataDto;

  payerType?: PayerType;
}
