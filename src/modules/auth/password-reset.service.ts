import { ErrorCodes } from '@/common/error-codes';
import { PasswordResetToken } from '@/database/entities/password-reset-token.entity';
import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import * as argon from 'argon2';
import { Repository } from 'typeorm';
import { EmployeeDto } from '../employees/dto/employee.dto';
import { EmployeesService } from '../employees/employees.service';
import { EmailService } from '@/common/mailer/email.service';

@Injectable()
export class PasswordResetService {
  private readonly logger = new Logger(PasswordResetService.name);

  constructor(
    private employeesService: EmployeesService,
    private jwtService: JwtService,
    private config: ConfigService,
    private emailService: EmailService,
    @InjectRepository(PasswordResetToken)
    private tokenRepository: Repository<PasswordResetToken>,
  ) {}

  async requestReset(email: string) {
    const employee = await this.employeesService.findOne({ where: { email } });
    if (!employee) {
      throw new BadRequestException([
        {
          property: 'email',
          code: ErrorCodes.USER_NOT_FOUND,
        },
      ]);
    }

    // Invalidate any existing tokens
    await this.tokenRepository.update(
      {
        employee: {
          id: employee.id,
        },
        used: false,
      },
      { used: true },
    );

    const token = await this.generateResetToken(employee);

    // Save token to database
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 24); // 24 hour expiry

    await this.tokenRepository.save({
      token,
      employee,
      expiresAt,
    });

    // Send reset email
    await this.emailService.sendPasswordResetEmail(email, token);

    return { message: 'Reset instructions sent to your email' };
  }

  async resetPassword(token: string, newPassword: string) {
    try {
      const payload = await this.jwtService.verifyAsync(token, {
        secret: this.config.get('jwt.resetToken.secret'),
      });

      // Find and validate token
      const resetToken = await this.tokenRepository.findOne({
        where: { token, used: false },
        relations: ['employee'],
      });

      if (!resetToken || resetToken.used || resetToken.expiresAt < new Date()) {
        throw new BadRequestException([
          {
            property: 'token',
            code: ErrorCodes.INVALID_TOKEN,
          },
        ]);
      }

      const employee = await this.employeesService.findOne({
        where: { id: resetToken.employee.id },
      });
      employee.password = newPassword;
      await this.employeesService.save(employee);

      // Mark token as used
      await this.tokenRepository.update(resetToken.id, { used: true });

      return { message: 'Password reset successful' };
    } catch (error) {
      this.logger.error(error);
      throw new BadRequestException([
        {
          property: 'token',
          code: ErrorCodes.INVALID_TOKEN,
        },
      ]);
    }
  }

  private async generateResetToken(user: EmployeeDto) {
    const payload = {
      sub: user.id,
      email: user.email,
    };

    return this.jwtService.sign(payload, {
      secret: this.config.get('jwt.resetToken.secret'),
      expiresIn: this.config.get('jwt.resetToken.expiresIn'),
    });
  }
}
