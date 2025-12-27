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
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { UpdateNotificationDto } from './dto/update-notification.dto';

@ApiTags('User Notifications')
@Controller('notifications')
@Roles(Role.APP_USER)
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  @Get()
  @ApiOperation({
    summary: 'List user notifications',
    description:
      'Get paginated list of notifications for the authenticated user',
  })
  @ApiResponse({
    status: 200,
    description: 'Notifications retrieved successfully',
  })
  async findAll(
    @Paginate() query: QueryOptions,
    @AuthUser() user: AuthUserDto,
  ) {
    query.filter = { ...query.filter, recipient_id: `$eq:${user.id}` };
    return await this.notificationsService.app.findAll(query);
  }

  @Get(':id')
  @ApiOperation({
    summary: 'Get notification',
    description: 'Retrieve a specific notification by ID',
  })
  @ApiResponse({
    status: 200,
    description: 'Notification retrieved successfully',
  })
  @ApiResponse({ status: 404, description: 'Notification not found' })
  findOne(@Param('id') id: string, @AuthUser() user: AuthUserDto) {
    return this.notificationsService.app.find({
      where: { id, recipient: { id: user.id } },
    });
  }

  @Delete(':id')
  @ApiOperation({
    summary: 'Delete notification',
    description: 'Delete a specific notification for the authenticated user',
  })
  @ApiResponse({
    status: 200,
    description: 'Notification deleted successfully',
  })
  @ApiResponse({ status: 404, description: 'Notification not found' })
  async delete(@Param('id') id: string, @AuthUser() user: AuthUserDto) {
    console.log('Deleting notification with id:', id, 'for user:', user.id);
    return this.notificationsService.app.delete(id, {
      where: { recipient: { id: user.id } },
    });
  }

  @Delete()
  @ApiOperation({
    summary: 'Delete all notifications',
    description: 'Delete all notifications for the authenticated user',
  })
  @ApiResponse({
    status: 200,
    description: 'All notifications deleted successfully',
  })
  async deleteAll(@AuthUser() user: AuthUserDto) {
    return this.notificationsService.app.deleteBy({
      recipient: { id: user.id },
    });
  }

  @Patch(':id')
  @ApiOperation({
    summary: 'Update notification',
    description: 'Update notification status (e.g., mark as read)',
  })
  @ApiResponse({
    status: 200,
    description: 'Notification updated successfully',
  })
  @ApiResponse({ status: 404, description: 'Notification not found' })
  update(
    @Param('id') id: string,
    @Body() updateNotificationDto: UpdateNotificationDto,
    @AuthUser() user: AuthUserDto,
  ) {
    return this.notificationsService.app.update(id, updateNotificationDto, {
      where: {
        recipient: { id: user.id },
      },
    });
  }
}
