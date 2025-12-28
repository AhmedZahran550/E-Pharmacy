import {
  Controller,
  Sse,
  Req,
  MessageEvent,
  Param,
  ForbiddenException,
} from '@nestjs/common';
import { Observable, interval, fromEvent } from 'rxjs';
import { map } from 'rxjs/operators';
import { ConsultationsService } from './consultations.service';
import { EventEmitter } from 'events';
import { Request } from 'express';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
} from '@nestjs/swagger';

@ApiTags('Consultation Real-time Stream')
@Controller('consultations')
@ApiBearerAuth()
export class ConsultationSseController {
  private eventEmitter = new EventEmitter();

  constructor(private consultationsService: ConsultationsService) {}

  @Sse(':id/stream')
  @ApiOperation({ summary: 'Stream real-time consultation updates via SSE' })
  @ApiResponse({ status: 200, description: 'SSE stream established' })
  @ApiParam({ name: 'id', description: 'Consultation ID' })
  streamConsultation(
    @Param('id') consultationId: string,
    @Req() req: Request & { user: any },
  ): Observable<MessageEvent> {
    const userId = req.user.id;

    // Verify user is participant
    this.consultationsService
      .verifyParticipant(consultationId, userId)
      .then((isParticipant) => {
        if (!isParticipant) {
          throw new ForbiddenException(
            'Not authorized to access this consultation',
          );
        }
      });

    // Send initial connection confirmation
    setTimeout(() => {
      this.eventEmitter.emit(`consultation:${consultationId}`, {
        type: 'connected',
        data: { message: 'Connected to consultation stream' },
      });
    }, 100);

    // Return observable that listens for events
    return fromEvent(this.eventEmitter, `consultation:${consultationId}`).pipe(
      map((event: any) => ({
        data: event,
        id: Date.now().toString(),
        type: event.type,
        retry: 10000, // Retry connection after 10 seconds if dropped
      })),
    );
  }

  // Method to send message to consultation participants
  sendMessageToConsultation(consultationId: string, message: any) {
    this.eventEmitter.emit(`consultation:${consultationId}`, {
      type: 'new_message',
      data: message,
    });
  }

  // Method to send typing indicator
  sendTypingIndicator(
    consultationId: string,
    userId: string,
    isTyping: boolean,
  ) {
    this.eventEmitter.emit(`consultation:${consultationId}`, {
      type: 'typing',
      data: { userId, isTyping },
    });
  }

  // Method to notify doctor joined
  notifyDoctorJoined(consultationId: string, doctor: any) {
    this.eventEmitter.emit(`consultation:${consultationId}`, {
      type: 'doctor_joined',
      data: { doctor },
    });
  }

  // Method to notify consultation completed
  notifyConsultationCompleted(consultationId: string, summary: string) {
    this.eventEmitter.emit(`consultation:${consultationId}`, {
      type: 'consultation_completed',
      data: { summary },
    });
  }
}
