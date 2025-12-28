import {
  IsEnum,
  IsString,
  IsObject,
  IsOptional,
  MaxLength,
} from 'class-validator';
import { MessageType } from '@/database/entities/consultation-message.entity';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class SendMessageDto {
  @ApiProperty({
    enum: MessageType,
    description: 'Type of message being sent',
  })
  @IsEnum(MessageType)
  type: MessageType;

  @ApiProperty({
    description: 'Content of the message',
    maxLength: 2000,
  })
  @IsString()
  @MaxLength(2000)
  content: string;

  @ApiPropertyOptional({
    description:
      'Additional metadata for the message (e.g., file URLs, item IDs)',
  })
  @IsObject()
  @IsOptional()
  metadata?: any;
}
