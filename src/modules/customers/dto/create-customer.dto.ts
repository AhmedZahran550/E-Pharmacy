import {
  IsString,
  IsEmail,
  IsOptional,
  IsNumber,
  IsBoolean,
  IsArray,
  Min,
  Max,
  IsNotEmpty,
  MaxLength,
  MinLength,
  IsPhoneNumber,
  IsDecimal,
  ValidateNested,
  ArrayMinSize,
} from 'class-validator';
import { Type, Transform } from 'class-transformer';

// Create Customer DTO (for POST requests)
export class CreateCustomerDto {
  @IsString()
  @IsNotEmpty()
  @MinLength(2)
  @MaxLength(100)
  name: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  contactName?: string;

  @IsOptional()
  @IsString()
  @MaxLength(20)
  contactTel?: string;

  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(1000)
  maxUsers?: number;

  @IsOptional()
  @IsEmail()
  contactEmail?: string;

  @IsOptional()
  @IsBoolean()
  disabled?: boolean;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(999999)
  @Transform(({ value }) => parseFloat(value))
  currentBalance?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(999999)
  @Transform(({ value }) => parseFloat(value))
  creditLimit?: number;
}
