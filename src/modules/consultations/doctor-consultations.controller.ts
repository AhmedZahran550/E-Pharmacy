import { Controller, Post, Get, Patch, Param, Body } from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { Roles } from '@/modules/auth/decorators/roles.decorator';
import { AuthUser } from '@/modules/auth/decorators/auth-user.decorator';
import { Employee } from '@/database/entities/employee.entity';
import { ConsultationsService } from './consultations.service';
import { MedicineSchedulesService } from '../medicine-schedules/medicine-schedules.service';
import { CompleteConsultationDto } from './dto/complete-consultation.dto';
import { ToggleAvailabilityDto } from './dto/toggle-availability.dto';
import { CreateMedicineScheduleDto } from '../medicine-schedules/dto/create-medicine-schedule.dto';
import { Consultation } from '@/database/entities/consultation.entity';
import { ConsultationMessage } from '@/database/entities/consultation-message.entity';
import { MedicineSchedule } from '@/database/entities/medicine-schedule.entity';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { Role } from '@/modules/auth/role.model';
import { SendMessageDto } from './dto/send-message.dto';
import { SendTypingDto } from './dto/send-typing.dto';
import { ConsultationSseController } from './consultation-sse.controller';

@ApiTags('Doctor Consultations')
@Controller('doctor/consultations')
@Roles(Role.PROVIDER_DOCTOR, Role.PROVIDER_ADMIN)
@ApiBearerAuth()
export class DoctorConsultationsController {
  constructor(
    private readonly consultationsService: ConsultationsService,
    private readonly medicineSchedulesService: MedicineSchedulesService,
    private readonly sseController: ConsultationSseController,
    @InjectRepository(Employee)
    private readonly employeeRepository: Repository<Employee>,
  ) {}

  @Get('active')
  @ApiOperation({ summary: 'Get doctor active consultations' })
  @ApiResponse({ status: 200, description: 'List of active consultations' })
  async getActiveConsultations(
    @AuthUser() doctor: Employee,
  ): Promise<Consultation[]> {
    return await this.consultationsService.getDoctorActiveConsultations(
      doctor.id,
    );
  }

  @Post(':id/accept')
  @ApiOperation({ summary: 'Accept a consultation from the queue' })
  @ApiResponse({ status: 200, description: 'Consultation accepted' })
  async acceptConsultation(
    @AuthUser() doctor: Employee,
    @Param('id') id: string,
  ): Promise<Consultation> {
    const consultation = await this.consultationsService.acceptConsultation(
      id,
      doctor.id,
    );

    // Notify user via SSE that doctor has joined
    this.sseController.notifyDoctorJoined(id, {
      id: doctor.id,
      firstName: doctor.firstName,
      lastName: doctor.lastName,
      imageUrl: doctor.imageUrl,
      averageRating: doctor.averageRating,
    });

    return consultation;
  }

  @Get(':id')
  @ApiOperation({
    summary: 'Get consultation details with user medical profile',
  })
  @ApiResponse({ status: 200, description: 'Consultation details' })
  async getConsultation(
    @AuthUser() doctor: Employee,
    @Param('id') id: string,
  ): Promise<Consultation> {
    const consultation = await this.consultationsService.getConsultation(id);

    // Verify doctor is participant
    const isParticipant = await this.consultationsService.verifyParticipant(
      id,
      doctor.id,
    );
    if (!isParticipant) {
      throw new Error('Not authorized');
    }

    return consultation;
  }

  @Post(':id/messages')
  @ApiOperation({ summary: 'Send a message in consultation' })
  @ApiResponse({ status: 201, description: 'Message sent' })
  async sendMessage(
    @AuthUser() doctor: Employee,
    @Param('id') consultationId: string,
    @Body() dto: SendMessageDto,
  ): Promise<ConsultationMessage> {
    // Save message to database
    const message = await this.consultationsService.createMessage({
      consultationId,
      senderId: doctor.id,
      senderRole: 'DOCTOR' as any,
      content: dto.content,
      type: dto.type as any,
      metadata: dto.metadata,
    });

    // Broadcast via SSE to all connected clients
    this.sseController.sendMessageToConsultation(consultationId, message);

    return message;
  }

  @Post(':id/typing')
  @ApiOperation({ summary: 'Send typing indicator' })
  @ApiResponse({ status: 200, description: 'Typing indicator sent' })
  async sendTyping(
    @AuthUser() doctor: Employee,
    @Param('id') consultationId: string,
    @Body() dto: SendTypingDto,
  ): Promise<{ success: boolean }> {
    // Broadcast typing indicator via SSE
    this.sseController.sendTypingIndicator(
      consultationId,
      doctor.id,
      dto.isTyping,
    );

    return { success: true };
  }

  @Post(':id/medicine-schedule')
  @ApiOperation({ summary: 'Create medicine schedule for user' })
  @ApiResponse({ status: 201, description: 'Medicine schedule created' })
  async createMedicineSchedule(
    @AuthUser() doctor: Employee,
    @Param('id') consultationId: string,
    @Body() dto: CreateMedicineScheduleDto,
  ): Promise<MedicineSchedule> {
    const consultation =
      await this.consultationsService.getConsultation(consultationId);

    return await this.medicineSchedulesService.create(
      consultation.userId,
      dto,
      consultationId,
    );
  }

  @Patch(':id/complete')
  @ApiOperation({ summary: 'Complete a consultation' })
  @ApiResponse({ status: 200, description: 'Consultation completed' })
  async completeConsultation(
    @AuthUser() doctor: Employee,
    @Param('id') id: string,
    @Body() dto: CompleteConsultationDto,
  ): Promise<Consultation> {
    const consultation = await this.consultationsService.completeConsultation(
      id,
      doctor.id,
      dto,
    );

    // Notify user via SSE that consultation is completed
    this.sseController.notifyConsultationCompleted(id, dto.doctorSummary);

    return consultation;
  }

  @Patch('availability')
  @ApiOperation({ summary: 'Toggle availability for consultations' })
  @ApiResponse({ status: 200, description: 'Availability updated' })
  async toggleAvailability(
    @AuthUser() doctor: Employee,
    @Body() dto: ToggleAvailabilityDto,
  ): Promise<{ availableForConsultation: boolean }> {
    await this.employeeRepository.update(doctor.id, {
      availableForConsultation: dto.available,
    });

    return { availableForConsultation: dto.available };
  }
}
