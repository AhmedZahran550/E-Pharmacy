import { IsString, IsOptional, MaxLength } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CompleteConsultationDto {
  @ApiProperty({
    description: 'Summary of the consultation to share with the user',
    maxLength: 2000,
  })
  @IsString()
  @MaxLength(2000)
  doctorSummary: string;

  @ApiPropertyOptional({
    description: 'Private notes from the doctor (not shared with user)',
    maxLength: 2000,
  })
  @IsString()
  @IsOptional()
  @MaxLength(2000)
  doctorNotes?: string;
}
