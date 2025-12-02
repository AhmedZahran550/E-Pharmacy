import constants from '@/common/constants';
import { IsUUIDObj, UUIDObject } from '@/common/decorators/isObjId.decorator';
import { Relationship, UserStatus } from '@/database/entities/user.entity';
import { CreateUserDto } from '@/modules/users/dto/create-user.dto';
import { OmitType } from '@nestjs/mapped-types';
import {
  IsEnum,
  IsOptional,
  IsString,
  Matches,
  ValidateIf,
} from 'class-validator';

export class CreateMemberDto extends OmitType(CreateUserDto, [
  'mobile',
  'plan',
] as const) {
  constructor(createMemberDto: Partial<CreateMemberDto>) {
    super(createMemberDto);
    Object.assign(this, createMemberDto);
  }

  @IsOptional()
  @ValidateIf((o: CreateMemberDto) => o.relationship !== Relationship.CHILD)
  @Matches(constants.regex.mobile, {
    message: 'validation.INVALID_MOBILE',
  })
  mobile: string;

  @IsEnum(Relationship)
  @IsOptional()
  relationship: Relationship;

  @IsOptional()
  @IsString()
  ownerId: string;

  @IsOptional()
  @IsString()
  familyId: string;

  status?: UserStatus;
}
