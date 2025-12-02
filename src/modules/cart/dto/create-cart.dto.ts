import { IsUUIDObj, UUIDObject } from '@/common/decorators/isObjId.decorator';
import { SessionDto } from '@/common/models/session.dto';
import { CartItem } from '@/database/entities/cart-item.entity';
import { AuthUserDto } from '@/modules/auth/dto/auth-user.dto';
import { Type } from 'class-transformer';
import {
  IsArray,
  IsBoolean,
  isBoolean,
  IsNumber,
  IsObject,
  IsOptional,
  IsString,
  IsUUID,
  ValidateNested,
} from 'class-validator';
export class ExtrasDto {
  @IsOptional()
  @IsNumber()
  lengthOfStayInDays?: number;
}
export class CartItemDto {
  @IsString()
  id: string;

  @IsNumber()
  @IsOptional()
  price?: number;

  @IsString()
  @IsOptional()
  notes?: string;

  @IsObject()
  @ValidateNested({ each: true })
  @Type(() => ExtrasDto)
  @IsOptional()
  extras?: ExtrasDto;

  @IsOptional()
  @IsNumber()
  quantity: number = 1;
}

export class CreateCartDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CartItemDto)
  cartItems: CartItemDto[];

  @IsOptional()
  @IsString()
  appliedCode?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  offerIds?: string[]; // Changed from offerId to offerIds array

  @IsOptional()
  @IsNumber()
  coverageAmount?: number;

  @IsOptional()
  @IsUUIDObj()
  user?: UUIDObject;

  @IsUUIDObj()
  branch: UUIDObject;

  @IsBoolean()
  @IsOptional()
  isSaved?: boolean = false;
}

export class CreateCartOfferDto {
  @IsArray()
  @IsString({ each: true })
  offerIds: string[];
}

export class CreateCartItemDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CartItemDto)
  items: CartItemDto[];
}

export class EmployeeCreateCartDto extends CreateCartDto {
  @IsUUIDObj()
  user: UUIDObject;
}
