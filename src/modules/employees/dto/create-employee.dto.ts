import constants from '@/common/constants';
import { Gender } from '@/common/models/gender.model';
import { NAME_REGEX } from '@/common/regex.const';
import {
  IsArray,
  IsBoolean,
  IsEmail,
  IsEnum,
  IsOptional,
  IsString,
  Length,
  Matches,
  ValidateNested,
} from 'class-validator';
import { Role } from '../../auth/role.model';
import { IsUUIDObj, UUIDObject } from '@/common/decorators/isObjId.decorator';
import { Type } from 'class-transformer';
import { Policy, PolicyAction, Subject } from '@/modules/auth/policies.types';

export class UserPolicy implements Policy {
  @IsString()
  @IsEnum(Subject, { each: true })
  subject: Subject;

  @IsArray()
  @IsEnum(PolicyAction, { each: true })
  actions: PolicyAction[];

  @IsString()
  @IsOptional()
  type?: 'allow' | 'deny';
}

export class CreateEmployeeDto {
  constructor(dto: Partial<CreateEmployeeDto>) {
    Object.assign(this, dto);
  }

  id: string;

  // @ApiProperty()
  @IsOptional()
  @IsEmail()
  @Length(5, 255)
  email: string;

  // @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  password: string;

  @IsOptional()
  @IsString()
  @Length(2, 20)
  employeeId: string;

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
  @IsEnum(Gender)
  gender: Gender;

  // @ApiProperty()
  @IsOptional()
  @Matches(constants.regex.mobile, {
    message: 'validation.INVALID_MOBILE',
  })
  mobile: string;

  @IsOptional()
  @IsString()
  nationalId: string;

  @IsOptional()
  @IsBoolean()
  disabled?: boolean;

  @IsOptional()
  @IsBoolean()
  locked?: boolean;

  @IsOptional()
  @IsEnum(Role, { each: true })
  roles: Role[];

  @IsUUIDObj()
  @IsOptional()
  branch: UUIDObject;

  @IsOptional()
  @IsUUIDObj()
  customer: UUIDObject;

  @ValidateNested({ each: true })
  @IsOptional()
  @Type(() => UserPolicy)
  @IsArray()
  policies: UserPolicy[];
}
