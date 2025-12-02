import { IsUUIDObj, UUIDObject } from '@/common/decorators/isObjId.decorator';
import { IsEnum, IsOptional } from 'class-validator';

export enum CartAction {
  SAVE = 'save',
  RE_ORDER = 'RE_ORDER',
}

export class CartActionDto {
  @IsEnum(CartAction)
  type: CartAction;

  @IsOptional()
  @IsUUIDObj()
  user: UUIDObject;
}
