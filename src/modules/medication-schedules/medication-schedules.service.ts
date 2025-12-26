import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { MedicationSchedule } from '@/database/entities/medication-schedule.entity';
import { CreateMedicationScheduleDto } from './dto/create-medication-schedule.dto';
import { UpdateMedicationScheduleDto } from './dto/update-medication-schedule.dto';

@Injectable()
export class MedicationSchedulesService {
  constructor(
    @InjectRepository(MedicationSchedule)
    private scheduleRepository: Repository<MedicationSchedule>,
  ) {}

  async create(
    userId: string,
    dto: CreateMedicationScheduleDto,
    consultationId?: string,
  ): Promise<MedicationSchedule> {
    const schedule = this.scheduleRepository.create({
      ...dto,
      userId,
      consultationId,
    });

    return await this.scheduleRepository.save(schedule);
  }

  async findUserSchedules(
    userId: string,
    activeOnly?: boolean,
  ): Promise<MedicationSchedule[]> {
    const where: any = { userId };
    if (activeOnly) {
      where.isActive = true;
    }

    return await this.scheduleRepository.find({
      where,
      relations: ['item'],
      order: { metadata: { createdAt: 'DESC' } },
    });
  }

  async findOne(id: string, userId: string): Promise<MedicationSchedule> {
    const schedule = await this.scheduleRepository.findOne({
      where: { id, userId },
      relations: ['item', 'consultation'],
    });

    if (!schedule) {
      throw new NotFoundException('Medication schedule not found');
    }

    return schedule;
  }

  async update(
    id: string,
    userId: string,
    dto: UpdateMedicationScheduleDto,
  ): Promise<MedicationSchedule> {
    const schedule = await this.findOne(id, userId);

    Object.assign(schedule, dto);

    return await this.scheduleRepository.save(schedule);
  }

  async delete(id: string, userId: string): Promise<void> {
    const schedule = await this.findOne(id, userId);

    await this.scheduleRepository.remove(schedule);
  }

  async getTodaySchedules(userId: string): Promise<MedicationSchedule[]> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    return await this.scheduleRepository
      .createQueryBuilder('schedule')
      .where('schedule.userId = :userId', { userId })
      .andWhere('schedule.isActive = true')
      .andWhere('schedule.startDate <= :today', { today })
      .andWhere('(schedule.endDate IS NULL OR schedule.endDate >= :today)', {
        today,
      })
      .leftJoinAndSelect('schedule.item', 'item')
      .getMany();
  }

  async markAsTaken(
    scheduleId: string,
    userId: string,
    takenAt: Date,
    notes?: string,
  ): Promise<void> {
    const schedule = await this.findOne(scheduleId, userId);

    // In a full implementation, you would create a MedicationLog entity
    // to track adherence. For now, we'll just verify the schedule exists.
    // TODO: Implement medication adherence tracking
  }
}
