import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  Consultation,
  ConsultationStatus,
} from '@/database/entities/consultation.entity';
import {
  ConsultationMessage,
  SenderRole,
} from '@/database/entities/consultation-message.entity';
import { Employee } from '@/database/entities/employee.entity';
import { RequestConsultationDto } from './dto/request-consultation.dto';
import { CompleteConsultationDto } from './dto/complete-consultation.dto';
import { RateConsultationDto } from './dto/rate-consultation.dto';

@Injectable()
export class ConsultationsService {
  constructor(
    @InjectRepository(Consultation)
    private consultationRepository: Repository<Consultation>,
    @InjectRepository(ConsultationMessage)
    private messageRepository: Repository<ConsultationMessage>,
    @InjectRepository(Employee)
    private employeeRepository: Repository<Employee>,
  ) {}

  async requestConsultation(
    userId: string,
    dto: RequestConsultationDto,
  ): Promise<Consultation> {
    const consultationNo = this.generateConsultationNo();
    const expiresAt = new Date();
    expiresAt.setMinutes(
      expiresAt.getMinutes() +
        (parseInt(process.env.CONSULTATION_EXPIRY_MINUTES) || 30),
    );

    const consultation = this.consultationRepository.create({
      consultationNo,
      type: dto.type,
      status: ConsultationStatus.REQUESTED,
      userId,
      branchId: dto.branchId,
      userInitialMessage: dto.initialMessage,
      expiresAt,
    });

    return await this.consultationRepository.save(consultation);
  }

  async acceptConsultation(
    consultationId: string,
    doctorId: string,
  ): Promise<Consultation> {
    const consultation = await this.consultationRepository.findOne({
      where: { id: consultationId },
      relations: ['doctor'],
    });

    if (!consultation) {
      throw new NotFoundException('Consultation not found');
    }

    if (consultation.status !== ConsultationStatus.REQUESTED) {
      throw new BadRequestException('Consultation is no longer available');
    }

    // Check doctor's concurrent consultation limit
    const doctor = await this.employeeRepository.findOne({
      where: { id: doctorId },
    });

    if (!doctor?.availableForConsultation) {
      throw new BadRequestException(
        'Doctor is not available for consultations',
      );
    }

    if (doctor.activeConsultationsCount >= doctor.maxConcurrentConsultations) {
      throw new BadRequestException(
        'Doctor has reached maximum concurrent consultations',
      );
    }

    consultation.doctorId = doctorId;
    consultation.status = ConsultationStatus.ASSIGNED;
    consultation.assignedAt = new Date();
    consultation.startedAt = new Date();

    await this.employeeRepository.update(doctorId, {
      activeConsultationsCount: () => 'active_consultations_count + 1',
    });

    return await this.consultationRepository.save(consultation);
  }

  async createMessage(data: {
    consultationId: string;
    senderId: string;
    senderRole: SenderRole;
    content: string;
    type: string;
    metadata?: any;
  }): Promise<ConsultationMessage> {
    const message = this.messageRepository.create({
      consultationId: data.consultationId,
      senderRole: data.senderRole,
      type: data.type as any,
      content: data.content,
      messageMetadata: data.metadata,
      senderUserId: data.senderRole === SenderRole.USER ? data.senderId : null,
      senderDoctorId:
        data.senderRole === SenderRole.DOCTOR ? data.senderId : null,
    });

    const saved = await this.messageRepository.save(message);

    // Update message count
    await this.consultationRepository.increment(
      { id: data.consultationId },
      'messageCount',
      1,
    );

    return saved;
  }

  async getConsultation(id: string, userId?: string): Promise<Consultation> {
    const consultation = await this.consultationRepository.findOne({
      where: { id },
      relations: ['user', 'doctor', 'branch'],
    });

    if (!consultation) {
      throw new NotFoundException('Consultation not found');
    }

    return consultation;
  }

  async getUserConsultations(userId: string): Promise<Consultation[]> {
    return await this.consultationRepository.find({
      where: { userId },
      relations: ['doctor', 'branch'],
      order: { metadata: { createdAt: 'DESC' } },
    });
  }

  async getDoctorActiveConsultations(
    doctorId: string,
  ): Promise<Consultation[]> {
    return await this.consultationRepository.find({
      where: {
        doctorId,
        status: ConsultationStatus.IN_PROGRESS,
      },
      relations: ['user', 'branch'],
      order: { startedAt: 'DESC' },
    });
  }

  async completeConsultation(
    consultationId: string,
    doctorId: string,
    dto: CompleteConsultationDto,
  ): Promise<Consultation> {
    const consultation = await this.consultationRepository.findOne({
      where: { id: consultationId, doctorId },
    });

    if (!consultation) {
      throw new NotFoundException('Consultation not found');
    }

    if (consultation.status === ConsultationStatus.COMPLETED) {
      throw new BadRequestException('Consultation is already completed');
    }

    consultation.status = ConsultationStatus.COMPLETED;
    consultation.completedAt = new Date();
    consultation.doctorSummary = dto.doctorSummary;
    consultation.doctorNotes = dto.doctorNotes;

    await this.employeeRepository.update(doctorId, {
      activeConsultationsCount: () => 'active_consultations_count - 1',
    });

    return await this.consultationRepository.save(consultation);
  }

  async rateConsultation(
    consultationId: string,
    userId: string,
    dto: RateConsultationDto,
  ): Promise<Consultation> {
    const consultation = await this.consultationRepository.findOne({
      where: { id: consultationId },
    });

    if (!consultation) {
      throw new Error('Consultation not found');
    }

    if (consultation.status !== ConsultationStatus.COMPLETED) {
      throw new Error('Can only rate completed consultations');
    }

    if (consultation.userId !== userId) {
      throw new Error('Not authorized');
    }

    // Update consultation rating
    consultation.rating = dto.rating;
    consultation.ratingNotes = dto.notes;

    // Update doctor's average rating
    const doctor = await this.employeeRepository.findOne({
      where: { id: consultation.doctorId },
    });

    if (doctor) {
      const totalRaters = (doctor.totalRaters || 0) + 1;
      const currentTotal = (doctor.averageRating || 0) * (totalRaters - 1);
      doctor.averageRating = (currentTotal + dto.rating) / totalRaters;
      doctor.totalRaters = totalRaters;
      await this.employeeRepository.save(doctor);
    }

    return await this.consultationRepository.save(consultation);
  }

  async verifyParticipant(
    consultationId: string,
    userId: string,
  ): Promise<boolean> {
    const consultation = await this.consultationRepository.findOne({
      where: { id: consultationId },
    });

    if (!consultation) {
      return false;
    }

    return consultation.userId === userId || consultation.doctorId === userId;
  }

  async markMessagesAsRead(
    consultationId: string,
    userId: string,
  ): Promise<void> {
    await this.messageRepository.update(
      {
        consultationId,
        isRead: false,
        senderUserId: userId ? null : undefined,
        senderDoctorId: userId ? undefined : null,
      },
      {
        isRead: true,
        readAt: new Date(),
      },
    );
  }

  private generateConsultationNo(): string {
    const timestamp = Date.now().toString();
    const random = Math.floor(Math.random() * 10000)
      .toString()
      .padStart(4, '0');
    return `CONS-${timestamp}${random}`;
  }
}
