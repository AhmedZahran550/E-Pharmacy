import {
  IsEnum,
  IsString,
  IsUUID,
  IsOptional,
  MaxLength,
} from 'class-validator';
import { ConsultationType } from '@/database/entities/consultation.entity';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class RequestConsultationDto {
  @ApiProperty({
    enum: ConsultationType,
    description: 'Type of consultation',
  })
  @IsEnum(ConsultationType)
  type: ConsultationType;

  @ApiProperty({
    description: 'ID of the branch where consultation is requested',
  })
  @IsUUID()
  branchId: string;

  @ApiPropertyOptional({
    description: 'Initial message or question from the user',
    maxLength: 1000,
  })
  @IsString()
  @IsOptional()
  @MaxLength(1000)
  initialMessage?: string;

  @ApiPropertyOptional({
    description: 'ID of the medication/item being inquired about',
  })
  @IsUUID()
  @IsOptional()
  itemId?: string;
}
