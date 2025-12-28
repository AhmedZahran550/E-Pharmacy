import {
  Controller,
  Post,
  Get,
  Patch,
  Param,
  Body,
  UseGuards,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { Roles } from '@/modules/auth/decorators/roles.decorator';
import { AuthUser } from '@/modules/auth/decorators/auth-user.decorator';
import { User } from '@/database/entities/user.entity';
import { ConsultationsService } from './consultations.service';
import { RequestConsultationDto } from './dto/request-consultation.dto';
import { SendMessageDto } from './dto/send-message.dto';
import { RateConsultationDto } from './dto/rate-consultation.dto';
import { SendTypingDto } from './dto/send-typing.dto';
import { Consultation } from '@/database/entities/consultation.entity';
import { ConsultationMessage } from '@/database/entities/consultation-message.entity';
import { Role } from '@/modules/auth/role.model';
import { ConsultationSseController } from './consultation-sse.controller';

@ApiTags('Consultations')
@Controller('consultations')
@Roles(Role.APP_USER)
@ApiBearerAuth()
export class ConsultationsController {
  constructor(
    private readonly consultationsService: ConsultationsService,
    private readonly sseController: ConsultationSseController,
  ) {}

  @Post()
  @ApiOperation({ summary: 'Request a new consultation' })
  @ApiResponse({ status: 201, description: 'Consultation request created' })
  async requestConsultation(
    @AuthUser() user: User,
    @Body() dto: RequestConsultationDto,
  ): Promise<Consultation> {
    return await this.consultationsService.requestConsultation(user.id, dto);
  }

  @Get()
  @ApiOperation({ summary: 'Get user consultation history' })
  @ApiResponse({ status: 200, description: 'List of consultations' })
  async getMyConsultations(@AuthUser() user: User): Promise<Consultation[]> {
    return await this.consultationsService.getUserConsultations(user.id);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get consultation details' })
  @ApiResponse({ status: 200, description: 'Consultation details' })
  async getConsultation(
    @AuthUser() user: User,
    @Param('id') id: string,
  ): Promise<Consultation> {
    const consultation = await this.consultationsService.getConsultation(id);

    // Verify user is participant
    const isParticipant = await this.consultationsService.verifyParticipant(
      id,
      user.id,
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
    @AuthUser() user: User,
    @Param('id') consultationId: string,
    @Body() dto: SendMessageDto,
  ): Promise<ConsultationMessage> {
    // Save message to database
    const message = await this.consultationsService.createMessage({
      consultationId,
      senderId: user.id,
      senderRole: 'USER' as any,
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
    @AuthUser() user: User,
    @Param('id') consultationId: string,
    @Body() dto: SendTypingDto,
  ): Promise<{ success: boolean }> {
    // Broadcast typing indicator via SSE
    this.sseController.sendTypingIndicator(
      consultationId,
      user.id,
      dto.isTyping,
    );

    return { success: true };
  }

  @Post(':id/rate')
  @ApiOperation({ summary: 'Rate a completed consultation' })
  @ApiResponse({ status: 200, description: 'Consultation rated' })
  async rateConsultation(
    @AuthUser() user: User,
    @Param('id') id: string,
    @Body() dto: RateConsultationDto,
  ): Promise<Consultation> {
    return await this.consultationsService.rateConsultation(id, user.id, dto);
  }
}
