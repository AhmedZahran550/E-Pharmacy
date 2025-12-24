import { ApiProperty } from '@nestjs/swagger';
import {
  IsNumber,
  IsOptional,
  IsString,
  Max,
  Min,
  ValidateIf,
} from 'class-validator';

export class RateDoctorDto {
  @ApiProperty({
    description: 'Rating value from 0 to 5',
    minimum: 0,
    maximum: 5,
    example: 4.5,
    type: Number,
  })
  @IsNumber()
  @Min(0)
  @Max(5)
  rating: number;

  @ApiProperty({
    description: 'Notes about the rating (required if rating is less than 5)',
    example: 'The service was good but the waiting time was a bit long.',
    required: false,
  })
  @ValidateIf((o) => o.rating < 5)
  @IsString()
  @ValidateIf((o) => o.rating >= 5)
  @IsOptional()
  notes?: string;
}
