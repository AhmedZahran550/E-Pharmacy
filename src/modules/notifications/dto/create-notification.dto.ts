import { IsUUIDObj } from '@/common/decorators/isObjId.decorator';
import {
  NotificationType,
  RelatedEntityType,
  SystemNotificationType,
} from '@/modules/notifications/dto/notification.enum';
import { Type } from 'class-transformer';
import {
  IsBoolean,
  IsEnum,
  IsOptional,
  IsString,
  ValidateNested,
  IsArray,
  IsObject,
} from 'class-validator';

class RelatedEntityDto {
  @IsEnum(RelatedEntityType)
  type: RelatedEntityType;

  @IsString()
  id: string;
}

export class CreateNotificationDto {
  @IsOptional()
  @IsString()
  title?: string;
  @IsOptional()
  @IsString()
  message?: string;
  @IsOptional()
  @IsUUIDObj()
  recipient: {
    id: string;
  };

  @IsOptional()
  @IsBoolean()
  isRead: boolean;

  @IsEnum(NotificationType)
  type: NotificationType;

  @ValidateNested()
  @Type(() => RelatedEntityDto)
  relatedEntity: RelatedEntityDto;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  pushTokens?: string[];

  @IsOptional()
  @IsObject()
  data?: Record<string, unknown>;
}
export class CreateSystemNotificationsDto {
  @IsString()
  title: string;

  @IsString()
  message: string;

  @IsUUIDObj()
  recipient: {
    id: string;
  };

  @IsOptional()
  @IsBoolean()
  isRead: boolean;

  @IsUUIDObj()
  @IsOptional()
  order: {
    id: string;
  };

  @IsEnum(SystemNotificationType)
  type: SystemNotificationType;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  pushTokens?: string[];

  @IsOptional()
  @IsObject()
  data?: Record<string, unknown>;
}
