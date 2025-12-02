import { AuthUser } from '@/modules/auth/decorators/auth-user.decorator';
import { Roles } from '@/modules/auth/decorators/roles.decorator';
import { AuthUserDto } from '@/modules/auth/dto/auth-user.dto';
import { IdentityConfirmationDto } from '@/modules/auth/dto/identity-confirmation.dto';
import { Role } from '@/modules/auth/role.model';
import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Post,
} from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { Public } from './decorators/public.decorator';
import { CredentialsDto } from './dto/credentials.dto';
import { SendOTPDto, VerifyOTPDto } from './dto/otp.dto';
import { SignUpDto } from './dto/signup.dto';
import { OtpService } from './otp.service';
import { Subject } from './policies.types';
@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(
    private authService: AuthService,
    private otpService: OtpService,
  ) {}

  @Public()
  @HttpCode(HttpStatus.CREATED)
  @Post('otp')
  sendOtp(@Body() otpdto: SendOTPDto) {
    return this.authService.sendOtp(otpdto.mobile);
  }

  @Public()
  @Post('signup')
  async signUp(@Body() signUpDto: SignUpDto) {
    return await this.authService.signUp(signUpDto);
  }

  @Public()
  @HttpCode(HttpStatus.OK)
  @Post('otp/verify')
  verifyOtp(@Body() otpdto: VerifyOTPDto) {
    return this.otpService.verifyOtp(otpdto.mobile, otpdto.otp);
  }

  @Public()
  @HttpCode(HttpStatus.OK)
  @Post('email/verify')
  verifyEmail(@Body('token') token: string) {
    return this.authService.verifyEmail(token);
  }

  @Public()
  @Post('token')
  async token(@Body() dto: CredentialsDto) {
    const res = await this.authService.signIn(dto);
    return res;
  }

  @Public()
  @Post('refresh-token')
  refreshToken(@Body() dto: CredentialsDto) {
    return this.authService.refreshToken(dto);
  }

  @Post('identity-confirmation')
  @Roles(Role.APP_USER)
  async identityConfirmation(
    @Body() data: IdentityConfirmationDto,
    @AuthUser() user: AuthUserDto,
  ) {
    return await this.authService.identityConfirmation(data, user);
  }

  @Roles(Role.ADMIN, Role.SUPER_ADMIN)
  @Get('policies/subject')
  async getPoliciesSubjects() {
    return Object.values(Subject);
  }

  @Post('logout')
  @HttpCode(HttpStatus.OK)
  async logout() {
    return { success: true };
  }
}
