import { Injectable } from '@nestjs/common';
import { AppNotificationService } from './app-notification.service';
import { SystemNotificationsService } from './system-notification.service';
import { CreateNotificationDto } from './dto/create-notification.dto';
import { CreateSystemNotificationsDto } from './dto/create-notification.dto'; // Assuming same DTO or similar interface
import { EntityManager } from 'typeorm';

@Injectable()
export class NotificationsService {
  constructor(
    private readonly appNotificationService: AppNotificationService,
    private readonly systemNotificationsService: SystemNotificationsService,
  ) {}

  // Delegate to AppNotificationService
  async createAppNotification(
    createDto: CreateNotificationDto,
    options?: { manager?: EntityManager },
  ) {
    return this.appNotificationService.create(createDto, options);
  }

  // Alias for backward compatibility (DBService behavior)
  async create(
    createDto: CreateNotificationDto,
    options?: { manager?: EntityManager },
  ) {
    return this.createAppNotification(createDto, options);
  }

  // Delegate to SystemNotificationsService
  async createSystemNotification(
    createDto: any, // Using any here to match the flexible usage we had, or strict CreateSystemNotificationsDto
    options?: { manager?: EntityManager },
  ) {
    return this.systemNotificationsService.create(createDto, options);
  }

  // Expose underlying services if needed
  get app() {
    return this.appNotificationService;
  }

  get system() {
    return this.systemNotificationsService;
  }

  // Delegate DBService methods to AppNotificationService (default behavior)
  async findAll(query?: any, qb?: any) {
    return this.appNotificationService.findAll(query, qb);
  }

  async findById(id: string) {
    return this.appNotificationService.findById(id);
  }

  async find(options: any) {
    return this.appNotificationService.find(options);
  }

  async update(id: string, updateDto: any, options?: any) {
    return this.appNotificationService.update(id, updateDto, options);
  }

  async remove(id: string) {
    return this.appNotificationService.remove(id);
  }

  async delete(id: string, options?: any) {
    return this.appNotificationService.delete(id, options);
  }

  async deleteBy(where: any) {
    return this.appNotificationService.deleteBy(where);
  }
}
