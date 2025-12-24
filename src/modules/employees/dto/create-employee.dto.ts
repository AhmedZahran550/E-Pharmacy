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
import { EmployeeType } from '@/database/entities/employee.entity';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class UserPolicy implements Policy {
  @ApiProperty({ enum: Subject })
  @IsString()
  @IsEnum(Subject, { each: true })
  subject: Subject;

  @ApiProperty({ enum: PolicyAction, isArray: true })
  @IsArray()
  @IsEnum(PolicyAction, { each: true })
  actions: PolicyAction[];

  @ApiPropertyOptional({ enum: ['allow', 'deny'] })
  @IsString()
  @IsOptional()
  type?: 'allow' | 'deny';
}

export class CreateEmployeeDto {
  constructor(dto: Partial<CreateEmployeeDto>) {
    Object.assign(this, dto);
  }

  @ApiPropertyOptional({
    example: 'employee@example.com',
    minLength: 5,
    maxLength: 255,
  })
  @IsOptional()
  @IsEmail()
  @Length(5, 255)
  email: string;

  @ApiPropertyOptional({
    example: 'StrongPassword123!',
    description: 'Employee password',
  })
  @IsString()
  @IsOptional()
  password: string;

  @ApiProperty({ example: 'Ahmed', minLength: 2, maxLength: 20 })
  @IsString()
  @Length(2, 20)
  @Matches(NAME_REGEX)
  firstName: string;

  @ApiPropertyOptional({ example: 'Mohamed', minLength: 2, maxLength: 20 })
  @IsOptional()
  @IsString()
  @Length(2, 20)
  @Matches(NAME_REGEX)
  middleName?: string;

  @ApiProperty({ example: 'Zahran', minLength: 2, maxLength: 20 })
  @IsString()
  @Length(2, 20)
  @Matches(NAME_REGEX)
  lastName: string;

  @ApiPropertyOptional({ enum: Gender, example: Gender.Male })
  @IsOptional()
  @IsEnum(Gender)
  gender: Gender;

  @ApiPropertyOptional({
    example: '01012345678',
    pattern: constants.regex.mobile.source,
  })
  @IsOptional()
  @Matches(constants.regex.mobile, {
    message: 'validation.INVALID_MOBILE',
  })
  mobile: string;

  @ApiPropertyOptional({ example: false })
  @IsOptional()
  @IsBoolean()
  disabled?: boolean;

  @ApiPropertyOptional({ example: false })
  @IsOptional()
  @IsBoolean()
  locked?: boolean;

  @ApiPropertyOptional({
    enum: Role,
    isArray: true,
    example: [Role.PROVIDER_DOCTOR],
  })
  @IsOptional()
  @IsEnum(Role, { each: true })
  roles: Role[];

  @ApiPropertyOptional({
    description: 'Branch UUID object',
    example: { id: '123e4567-e89b-12d3-a456-426614174000' },
  })
  @IsUUIDObj()
  @IsOptional()
  branch: UUIDObject;

  @ApiPropertyOptional({
    type: [UserPolicy],
    description: 'User policies for access control',
  })
  @ValidateNested({ each: true })
  @IsOptional()
  @Type(() => UserPolicy)
  @IsArray()
  policies?: UserPolicy[];

  @ApiProperty({ enum: EmployeeType, example: EmployeeType.PROVIDER })
  @IsEnum(EmployeeType)
  type: EmployeeType;

  createdBy?: string;
}
