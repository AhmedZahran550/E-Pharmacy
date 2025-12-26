import {
  IsString,
  IsEnum,
  IsDateString,
  IsArray,
  IsBoolean,
  IsNumber,
  IsOptional,
  IsUUID,
  MaxLength,
} from 'class-validator';
import { FrequencyType } from '@/database/entities/medication-schedule.entity';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateMedicationScheduleDto {
  @ApiProperty({
    description: 'Name of the medication',
  })
  @IsString()
  @MaxLength(255)
  medicationName: string;

  @ApiPropertyOptional({
    description: 'Instructions for taking the medication',
  })
  @IsString()
  @IsOptional()
  @MaxLength(2000)
  instructions?: string;

  @ApiProperty({
    enum: FrequencyType,
    description: 'How often the medication should be taken',
  })
  @IsEnum(FrequencyType)
  frequency: FrequencyType;

  @ApiPropertyOptional({
    description: 'Number of hours between doses (for EVERY_X_HOURS frequency)',
  })
  @IsNumber()
  @IsOptional()
  frequencyValue?: number;

  @ApiPropertyOptional({
    description:
      'Specific times of day to take medication (e.g., ["08:00", "14:00", "20:00"])',
    type: [String],
  })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  times?: string[];

  @ApiProperty({
    description: 'Start date for the medication schedule',
  })
  @IsDateString()
  startDate: string;

  @ApiPropertyOptional({
    description: 'End date for the medication schedule',
  })
  @IsDateString()
  @IsOptional()
  endDate?: string;

  @ApiPropertyOptional({
    description: 'Duration in days (alternative to endDate)',
  })
  @IsNumber()
  @IsOptional()
  durationDays?: number;

  @ApiPropertyOptional({
    description: 'Whether to send reminders',
    default: true,
  })
  @IsBoolean()
  @IsOptional()
  reminderEnabled?: boolean;

  @ApiPropertyOptional({
    description: 'Minutes before scheduled time to send reminder',
    default: 15,
  })
  @IsNumber()
  @IsOptional()
  reminderMinutesBefore?: number;

  @ApiPropertyOptional({
    description: 'ID of the medication item',
  })
  @IsUUID()
  @IsOptional()
  itemId?: string;

  @ApiPropertyOptional({
    description: 'Additional notes',
  })
  @IsString()
  @IsOptional()
  @MaxLength(1000)
  notes?: string;
}
