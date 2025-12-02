import { Paginate, QueryOptions } from '@/common/query-options';
import { AuthUser } from '@/modules/auth/decorators/auth-user.decorator';
import { Roles } from '@/modules/auth/decorators/roles.decorator';
import { AuthUserDto } from '@/modules/auth/dto/auth-user.dto';
import { Role } from '@/modules/auth/role.model';
import { NotificationsService } from '@/modules/notifications/notifications.service';
import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
} from '@nestjs/common';
import { UpdateNotificationDto } from './dto/update-notification.dto';

@Controller('recipient/notifications')
@Roles(Role.APP_USER)
export class UserNotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  @Get()
  async findAll(
    @Paginate() query: QueryOptions,
    @AuthUser() user: AuthUserDto,
  ) {
    query.filter = { ...query.filter, recipient_id: `$eq:${user.id}` };
    return await this.notificationsService.findAll(query);
  }

  @Get('unread-count')
  getUnreadCount(@AuthUser() user: AuthUserDto) {
    return this.notificationsService.findUnreadCount(user);
  }

  @Get(':id')
  findOne(@Param('id') id: string, @AuthUser() user: AuthUserDto) {
    return this.notificationsService.find({
      where: { id, recipient: { id: user.id } },
    });
  }

  @Delete(':id')
  async delete(@Param('id') id: string, @AuthUser() user: AuthUserDto) {
    console.log('Deleting notification with id:', id, 'for user:', user.id);
    return this.notificationsService.delete(id, {
      where: { recipient: { id: user.id } },
    });
  }

  @Delete()
  async deleteAll(@AuthUser() user: AuthUserDto) {
    return this.notificationsService.deleteBy({ recipient: { id: user.id } });
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() updateNotificationDto: UpdateNotificationDto,
    @AuthUser() user: AuthUserDto,
  ) {
    return this.notificationsService.update(id, updateNotificationDto, {
      where: {
        recipient: { id: user.id },
      },
    });
  }
}
