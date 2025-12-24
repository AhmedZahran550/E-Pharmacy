import {
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  Post,
  Put,
  Param,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiParam } from '@nestjs/swagger';
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
  @ApiOperation({
    summary: 'Request password reset',
    description: 'Request a password reset link to be sent to email',
  })
  @ApiResponse({
    status: 201,
    description:
      'Reset request processed (always returns success for security)',
  })
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
  @ApiOperation({
    summary: 'Reset password',
    description: 'Reset password using reset token',
  })
  @ApiParam({ name: 'token', description: 'Password reset token from email' })
  @ApiResponse({ status: 200, description: 'Password successfully reset' })
  @ApiResponse({ status: 400, description: 'Invalid or expired token' })
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
