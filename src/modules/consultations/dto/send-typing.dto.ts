import { IsBoolean } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class SendTypingDto {
  @ApiProperty({
    description: 'Whether the user is currently typing',
  })
  @IsBoolean()
  isTyping: boolean;
}
