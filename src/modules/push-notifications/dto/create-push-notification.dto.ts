import { IsObject, IsString } from 'class-validator';

export class CreatePushNotificationDto {
  @IsString({ each: true })
  tokens: string[];

  @IsString()
  title: string;

  @IsString()
  body: string;

  @IsObject()
  data?: Record<string, unknown>;
}
