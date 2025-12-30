import { IsEnum, IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { MessageType } from '@/database/entities/service-request-message.entity';

export class CreateServiceRequestMessageDto {
  @ApiProperty({ description: 'Message content' })
  @IsString()
  @IsNotEmpty()
  content: string;

  @ApiProperty({
    enum: MessageType,
    description: 'Type of the message',
    default: MessageType.TEXT,
  })
  @IsEnum(MessageType)
  @IsOptional()
  type?: MessageType = MessageType.TEXT;
}
