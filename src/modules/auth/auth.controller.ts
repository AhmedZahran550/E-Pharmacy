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
  UseGuards,
  Req,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
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
    return this.authService.verifyOtp(otpdto);
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

  @Roles(Role.ADMIN, Role.SUPER_ADMIN)
  @Get('policies/subject')
  async getPoliciesSubjects() {
    return Object.values(Subject);
  }

  // Google OAuth endpoints
  @Public()
  @Get('google')
  @UseGuards(AuthGuard('google'))
  async googleAuth() {
    // Initiates Google OAuth flow - handled by GoogleStrategy
    // This endpoint will redirect to Google's consent screen
  }

  @Public()
  @Get('google/callback')
  @UseGuards(AuthGuard('google'))
  async googleAuthCallback(@Req() req: any) {
    // Google strategy validates and returns user profile
    return await this.authService.validateGoogleUser(req.user);
  }

  // Facebook OAuth endpoints
  @Public()
  @Get('facebook')
  @UseGuards(AuthGuard('facebook'))
  async facebookAuth() {
    // Initiates Facebook OAuth flow - handled by FacebookStrategy
  }

  @Public()
  @Get('facebook/callback')
  @UseGuards(AuthGuard('facebook'))
  async facebookAuthCallback(@Req() req: any) {
    // Facebook strategy validates and returns user profile
    return await this.authService.validateFacebookUser(req.user);
  }

  // Apple Sign In endpoints
  @Public()
  @Post('apple')
  @UseGuards(AuthGuard('apple'))
  async appleAuth() {
    // Initiates Apple Sign In flow - handled by AppleStrategy
  }

  @Public()
  @Post('apple/callback')
  @UseGuards(AuthGuard('apple'))
  async appleAuthCallback(@Req() req: any) {
    // Apple strategy validates and returns user profile
    return await this.authService.validateAppleUser(req.user);
  }

  @Post('logout')
  @HttpCode(HttpStatus.OK)
  async logout() {
    return { success: true };
  }
}
