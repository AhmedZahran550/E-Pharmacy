import constants from '@/common/constants';
import { Relationship } from '@/database/entities/user.entity';
import { CreateUserDto } from '@/modules/users/dto/create-user.dto';
import { OmitType } from '@nestjs/mapped-types';
import {
  IsDateString,
  IsEnum,
  IsOptional,
  Matches,
  ValidateIf,
} from 'class-validator';
import { Type } from 'class-transformer';

export class CreateMemberDto extends OmitType(CreateUserDto, [
  'mobile',
  'plan',
  'password',
  'nationalId',
  'countryCode',
  'birthDate',
] as const) {
  constructor(createMemberDto: Partial<CreateMemberDto>) {
    super(createMemberDto);
    Object.assign(this, createMemberDto);
  }

  // Override birthDate to use IsDateString for API
  @IsDateString()
  @Type(() => String)
  birthDate: Date;

  // Mobile is optional but required for non-children
  @ValidateIf((o: CreateMemberDto) => o.relationship !== Relationship.CHILD)
  @Matches(constants.regex.mobile, {
    message: 'validation.INVALID_MOBILE',
  })
  @IsOptional()
  mobile?: string;

  // Relationship is required for family members
  @IsEnum(Relationship)
  relationship: Relationship;

  // Optional fields for family members
  @IsOptional()
  nationalId?: string;

  @IsOptional()
  countryCode?: string;
}
