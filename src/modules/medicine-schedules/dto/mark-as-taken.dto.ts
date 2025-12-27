import { IsDateString, IsString, IsOptional, MaxLength } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class MarkAsTakenDto {
  @ApiProperty({
    description: 'When the medication was taken',
  })
  @IsDateString()
  takenAt: string;

  @ApiPropertyOptional({
    description: 'Optional notes about taking the medication',
  })
  @IsString()
  @IsOptional()
  @MaxLength(500)
  notes?: string;
}
