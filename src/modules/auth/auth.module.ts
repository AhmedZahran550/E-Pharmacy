import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { JwtModule } from '@nestjs/jwt';
import { EmployeesModule } from '../employees/employees.module';
import { UsersModule } from '../users/users.module';
import { JwtStrategy } from './Jwt.strategy';
import { GoogleStrategy } from './strategies/google.strategy';
import { FacebookStrategy } from './strategies/facebook.strategy';
import { AppleStrategy } from './strategies/apple.strategy';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { JwtAuthGuard } from './jwt-auth.guard';
import { OtpService } from './otp.service';
import { RolesGuard } from './roles.guard';
import { SMSService } from './sms.service';
import { BranchAccessGuard } from './guards/branch-access.guard';
import { PasswordResetController } from './password-reset.controller';
import { PasswordResetService } from './password-reset.service';
import { EmailService } from '@/common/mailer/email.service';
import { PoliciesGuard } from './guards/policies.guard';
import { CaslAbilityFactory } from './casl-ability.factory';

@Module({
  imports: [UsersModule, EmployeesModule, JwtModule.register({})],
  exports: [AuthService],
  controllers: [AuthController, PasswordResetController],
  providers: [
    AuthService,
    SMSService,
    OtpService,
    EmailService,
    PasswordResetService,
    CaslAbilityFactory,
    JwtStrategy,
    GoogleStrategy,
    FacebookStrategy,
    AppleStrategy,
    {
      provide: APP_GUARD,
      useExisting: JwtAuthGuard,
    },
    JwtAuthGuard,
    {
      provide: APP_GUARD,
      useExisting: RolesGuard,
    },
    {
      provide: APP_GUARD,
      useExisting: PoliciesGuard,
    },
    RolesGuard,
    PoliciesGuard,
    BranchAccessGuard,
  ],
})
export class AuthModule {}
