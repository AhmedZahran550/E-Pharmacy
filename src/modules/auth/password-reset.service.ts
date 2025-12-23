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
import { UsersService } from '../users/users.service';
import { User } from '@/database/entities/user.entity';
import { Employee } from '@/database/entities/employee.entity';

@Injectable()
export class PasswordResetService {
  private readonly logger = new Logger(PasswordResetService.name);

  constructor(
    private employeesService: EmployeesService,
    private usersService: UsersService,
    private jwtService: JwtService,
    private config: ConfigService,
    private emailService: EmailService,
    @InjectRepository(PasswordResetToken)
    private tokenRepository: Repository<PasswordResetToken>,
    @InjectRepository(Employee)
    private employeeRepository: Repository<Employee>,
    @InjectRepository(User)
    private userRepository: Repository<User>,
  ) {}

  async requestReset(email: string, clientType: 'user' | 'employee') {
    let entity: User | Employee;
    let isUser = clientType === 'user';

    if (isUser) {
      // Find user
      const user = await this.usersService.findByEmail(email);

      if (!user) {
        throw new BadRequestException([
          {
            property: 'email',
            code: ErrorCodes.USER_NOT_FOUND,
          },
        ]);
      }

      entity = await this.userRepository.findOne({ where: { id: user.id } });
    } else {
      // Find employee
      const employee = await this.employeeRepository.findOne({
        where: { email },
      });

      if (!employee) {
        throw new BadRequestException([
          {
            property: 'email',
            code: ErrorCodes.USER_NOT_FOUND,
          },
        ]);
      }

      entity = employee;
    }
    // Invalidate any existing tokens
    const updateCondition = isUser
      ? { user: { id: entity.id }, used: false }
      : { employee: { id: entity.id }, used: false };

    await this.tokenRepository.update(updateCondition, { used: true });

    const token = await this.generateResetToken(entity);

    // Save token to database
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 24); // 24 hour expiry

    const tokenData: any = {
      token,
      expiresAt,
    };

    if (isUser) {
      tokenData.user = entity;
    } else {
      tokenData.employee = entity;
    }

    await this.tokenRepository.save(tokenData);

    // Send reset email
    await this.emailService.sendPasswordResetEmail(email, token);

    return { message: 'Reset instructions sent to your email' };
  }

  async resetPassword(
    token: string,
    newPassword: string,
    clientType: 'user' | 'employee',
  ) {
    try {
      await this.jwtService.verifyAsync(token, {
        secret: this.config.get('jwt.resetToken.secret'),
      });
      const isUser = clientType === 'user';
      // Find and validate token with appropriate relations
      const resetToken = await this.tokenRepository.findOne({
        where: { token, used: false },
        relations: isUser ? ['user'] : ['employee'],
      });
      if (!resetToken || resetToken.used || resetToken.expiresAt < new Date()) {
        throw new BadRequestException([
          {
            property: 'token',
            code: ErrorCodes.INVALID_TOKEN,
          },
        ]);
      }

      let entity: User | Employee;

      if (isUser) {
        const user = await this.userRepository.findOne({
          where: { id: resetToken.user.id },
        });

        if (!user) {
          throw new BadRequestException([
            {
              property: 'token',
              code: ErrorCodes.INVALID_TOKEN,
            },
          ]);
        }

        user.password = newPassword;
        await this.userRepository.save(user);
        entity = user;
      } else {
        const employee = await this.employeeRepository.findOne({
          where: { id: resetToken.employee.id },
        });

        if (!employee) {
          throw new BadRequestException([
            {
              property: 'token',
              code: ErrorCodes.INVALID_TOKEN,
            },
          ]);
        }

        employee.password = newPassword;
        await this.employeeRepository.save(employee);
        entity = employee;
      }

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

  private async generateResetToken(entity: User | Employee) {
    const payload = {
      sub: entity.id,
      email: entity.email,
    };

    return this.jwtService.sign(payload, {
      secret: this.config.get('jwt.resetToken.secret'),
      expiresIn: this.config.get('jwt.resetToken.expiresIn'),
    });
  }
}
