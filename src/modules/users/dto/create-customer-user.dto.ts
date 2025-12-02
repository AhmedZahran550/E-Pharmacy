import { OmitType, PartialType } from '@nestjs/mapped-types';
import { CreateUserDto } from './create-user.dto';
import { IsOptional, IsString, ValidateIf } from 'class-validator';
import { IsUUIDObj, UUIDObject } from '@/common/decorators/isObjId.decorator';

export class CustomerUserDto extends OmitType(CreateUserDto, [
  'plan',
] as const) {
  constructor(createMemberDto: Partial<CustomerUserDto>) {
    super(createMemberDto);
    Object.assign(this, createMemberDto);
  }

  @IsString()
  staffId: string;

  @IsUUIDObj()
  plan: UUIDObject;
}
