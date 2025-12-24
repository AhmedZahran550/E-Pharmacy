import { Paginate, QueryOptions } from '@/common/query-options';
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
import { ApiTags, ApiOperation, ApiResponse, ApiParam } from '@nestjs/swagger';
import { CreateNotificationDto } from './dto/create-notification.dto';
import { UpdateNotificationDto } from './dto/update-notification.dto';

@ApiTags('Admin - Notifications')
@Controller('notifications')
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  @Post()
  @ApiOperation({
    summary: 'Create notification',
    description: 'Create a new app notification (admin)',
  })
  @ApiResponse({
    status: 201,
    description: 'Notification created successfully',
  })
  create(@Body() createNotificationDto: CreateNotificationDto) {
    return this.notificationsService.createAppNotification(
      createNotificationDto,
    );
  }

  @Get()
  @ApiOperation({
    summary: 'List all notifications',
    description: 'Get paginated list of app notifications (admin)',
  })
  @ApiResponse({
    status: 200,
    description: 'Notifications retrieved successfully',
  })
  findAll(@Paginate() query: QueryOptions) {
    return this.notificationsService.app.findAll(query);
  }

  @Get(':id')
  @ApiOperation({
    summary: 'Get notification',
    description: 'Get notification by ID (admin)',
  })
  @ApiParam({ name: 'id', description: 'Notification UUID' })
  @ApiResponse({
    status: 200,
    description: 'Notification retrieved successfully',
  })
  @ApiResponse({ status: 404, description: 'Notification not found' })
  findOne(@Param('id') id: string) {
    return this.notificationsService.app.findById(id);
  }

  @Patch(':id')
  @ApiOperation({
    summary: 'Update notification',
    description: 'Update notification by ID (admin)',
  })
  @ApiParam({ name: 'id', description: 'Notification UUID' })
  @ApiResponse({
    status: 200,
    description: 'Notification updated successfully',
  })
  @ApiResponse({ status: 404, description: 'Notification not found' })
  update(
    @Param('id') id: string,
    @Body() updateNotificationDto: UpdateNotificationDto,
  ) {
    return this.notificationsService.app.update(id, updateNotificationDto);
  }

  @Delete(':id')
  @ApiOperation({
    summary: 'Delete notification',
    description: 'Delete notification by ID (admin)',
  })
  @ApiParam({ name: 'id', description: 'Notification UUID' })
  @ApiResponse({
    status: 200,
    description: 'Notification deleted successfully',
  })
  @ApiResponse({ status: 404, description: 'Notification not found' })
  remove(@Param('id') id: string) {
    return this.notificationsService.app.remove(id);
  }
}
