import {
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  Post,
  Put,
  Param,
} from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { Public } from './decorators/public.decorator';
import {
  RequestPasswordResetDto,
  ResetPasswordDto,
} from './dto/password-reset.dto';
import { PasswordResetService } from './password-reset.service';

@ApiTags('Password Reset')
@Controller('auth/password-resets')
export class PasswordResetController {
  constructor(private passwordResetService: PasswordResetService) {}

  @Public()
  @Post()
  @HttpCode(HttpStatus.CREATED)
  async createResetRequest(@Body() dto: RequestPasswordResetDto) {
    // Always return same response regardless of email existence
    try {
      await this.passwordResetService.requestReset(dto.email, dto.client_id);
    } catch (error) {
      // Silently catch errors to prevent email enumeration
    }
    return {
      message:
        'If an account exists with this email, you will receive reset instructions',
    };
  }

  @Public()
  @Put(':token')
  @HttpCode(HttpStatus.OK)
  async resetPassword(
    @Param('token') token: string,
    @Body() dto: Pick<ResetPasswordDto, 'newPassword' | 'client_id'>,
  ) {
    await this.passwordResetService.resetPassword(
      token,
      dto.newPassword,
      dto.client_id,
    );
    return { message: 'Password successfully reset' };
  }
}
