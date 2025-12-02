import { IDObject, IsUUIDObj, UUIDObject } from '@/common/decorators/isObjId.decorator';
import { IsNotEmpty, IsNumber, Min } from 'class-validator';
import { ObjectId } from 'typeorm';

export class CreateBranchItemDto {
  @IsNotEmpty()
  @IsUUIDObj()
  item: IDObject;

  @IsNumber()
  @Min(1)
  price: number;
}
