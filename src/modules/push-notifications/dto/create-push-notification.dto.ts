import { RelatedEntity } from '@/database/entities/notification.entity';
import { NotificationType } from '@/modules/notifications/dto/notification.enum';
import { IsEnum, IsObject, IsString, IsUUID } from 'class-validator';

export class CreatePushNotificationDto {
  @IsUUID()
  recipientId: string;

  @IsObject()
  relatedEntity: RelatedEntity;

  @IsString()
  title: string;

  @IsString()
  message: string;

  @IsEnum(NotificationType)
  type: NotificationType;
}
