import constants from '@/common/constants';
import { Gender } from '@/common/models/gender.model';
import { NAME_REGEX } from '@/common/regex.const';
import { Relationship, User, UserType } from '@/database/entities/user.entity';
import {
  IsArray,
  IsBoolean,
  IsDate,
  IsEmail,
  IsEnum,
  IsOptional,
  IsString,
  IsUrl,
  Length,
  Matches,
  ValidateIf,
} from 'class-validator';
import { IsNid } from '../../../common/decorators/nid.decorator';
import { Role } from '../../auth/role.model';
import { IsUUIDObj, UUIDObject } from '@/common/decorators/isObjId.decorator';

export class CreateUserDto {
  constructor(createUserDto: Partial<CreateUserDto>) {
    Object.assign(this, createUserDto);
  }

  @IsOptional()
  @IsEmail()
  @Length(5, 255)
  email: string;

  @IsString()
  @Length(2, 20)
  @Matches(NAME_REGEX)
  firstName: string;

  @IsOptional()
  @IsString()
  @Length(2, 20)
  @Matches(NAME_REGEX)
  middleName?: string;

  @IsString()
  @Length(2, 20)
  @Matches(NAME_REGEX)
  lastName: string;

  @IsOptional()
  @IsUrl()
  photoUrl?: string;

  @IsEnum(Gender)
  gender: Gender;

  @IsDate()
  birthDate: Date;

  // @ApiProperty()
  @Matches(constants.regex.mobile, {
    message: 'validation.INVALID_MOBILE',
  })
  mobile: string;

  mobileVerified?: boolean;

  @IsOptional()
  @IsEnum(UserType)
  type?: UserType;

  @IsString()
  @IsNid({ message: 'validation.INVALID_NID' })
  nationalId: string;

  @IsString()
  countryCode: string;

  @IsOptional()
  @IsBoolean()
  disabled?: boolean;

  @IsOptional()
  @IsBoolean()
  notificationsEnabled?: boolean;

  @IsOptional()
  @IsBoolean()
  locked?: boolean;

  @IsOptional()
  @IsBoolean()
  isPrincipal?: boolean;

  @IsOptional()
  @IsEnum(Relationship)
  relationship: Relationship;

  @IsOptional()
  @IsEnum(Role, { each: true })
  roles: Role[];

  @IsOptional()
  @IsUUIDObj()
  plan: UUIDObject;

  identityConfirmed?: boolean;
  identityConfirmedTrials?: number;

  lockedAt?: Date;

  qrCode?: string;
  createdBy?: string;

  // @IsObject()
  // metadata: Record<string, any>;
}
