import {
  IsNumber,
  Max,
  Min,
  IsOptional,
  IsString,
  ValidateIf,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class RateBranchDto {
  @ApiProperty({
    description: 'Branch rating from 0 to 5',
    minimum: 0,
    maximum: 5,
    example: 4.5,
  })
  @IsNumber()
  @Min(0)
  @Max(5)
  rating: number;

  @ApiProperty({
    description:
      'Notes or reason for the rating (required if rating is less than 5)',
    required: false,
    example: 'The service was good but the waiting time was too long',
  })
  @ValidateIf((o) => o.rating < 5)
  @IsString({ message: 'Notes are required when rating is less than 5' })
  @IsOptional()
  notes?: string;
}
