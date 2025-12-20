import { BloodType } from '@/common/models/medical-info.model';
import { Allergy, ChronicCondition } from '@/common/models/medical-info.model';
import constants from '@/common/constants';
import {
  IsArray,
  IsEnum,
  IsNumber,
  IsOptional,
  IsString,
  Matches,
  Min,
} from 'class-validator';

export class CreateMedicalProfileDto {
  constructor(partial: Partial<CreateMedicalProfileDto>) {
    Object.assign(this, partial);
  }

  @IsOptional()
  @IsEnum(BloodType)
  bloodType?: BloodType;

  @IsOptional()
  @IsArray()
  @IsEnum(Allergy, { each: true })
  allergies?: Allergy[];

  @IsOptional()
  @IsArray()
  @IsEnum(ChronicCondition, { each: true })
  chronicConditions?: ChronicCondition[];

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  currentMedications?: string[];

  @IsOptional()
  @IsNumber()
  @Min(0)
  height?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  weight?: number;

  @IsOptional()
  @IsString()
  insuranceProvider?: string;

  @IsOptional()
  @IsString()
  insurancePolicyNumber?: string;

  @IsOptional()
  @IsString()
  notes?: string;
}
