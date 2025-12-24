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
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
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
  @ApiOperation({
    summary: 'Send OTP',
    description: 'Send one-time password to mobile number for verification',
  })
  @ApiResponse({ status: 201, description: 'OTP sent successfully' })
  @ApiResponse({
    status: 400,
    description: 'Invalid mobile number or rate limit exceeded',
  })
  sendOtp(@Body() otpdto: SendOTPDto) {
    return this.authService.sendOtp(otpdto.mobile);
  }

  @Public()
  @Post('signup')
  @ApiOperation({
    summary: 'Sign up',
    description: 'Create a new user account',
  })
  @ApiResponse({ status: 201, description: 'Account created successfully' })
  @ApiResponse({
    status: 400,
    description: 'Invalid data or user already exists',
  })
  async signUp(@Body() signUpDto: SignUpDto) {
    return await this.authService.signUp(signUpDto);
  }

  @Public()
  @HttpCode(HttpStatus.OK)
  @Post('otp/verify')
  @ApiOperation({
    summary: 'Verify OTP',
    description: 'Verify one-time password and complete authentication',
  })
  @ApiResponse({ status: 200, description: 'OTP verified successfully' })
  @ApiResponse({ status: 400, description: 'Invalid or expired OTP' })
  verifyOtp(@Body() otpdto: VerifyOTPDto) {
    return this.authService.verifyOtp(otpdto);
  }

  @Public()
  @HttpCode(HttpStatus.OK)
  @Post('email/verify')
  @ApiOperation({
    summary: 'Verify email',
    description: 'Verify user email address with token',
  })
  @ApiResponse({ status: 200, description: 'Email verified successfully' })
  @ApiResponse({
    status: 400,
    description: 'Invalid or expired verification token',
  })
  verifyEmail(@Body('token') token: string) {
    return this.authService.verifyEmail(token);
  }

  @Public()
  @Post('token')
  @ApiOperation({
    summary: 'Login',
    description: 'Authenticate user with credentials and get access token',
  })
  @ApiResponse({ status: 201, description: 'Successfully authenticated' })
  @ApiResponse({ status: 401, description: 'Invalid credentials' })
  async token(@Body() dto: CredentialsDto) {
    const res = await this.authService.signIn(dto);
    return res;
  }

  @Public()
  @Post('refresh-token')
  @ApiOperation({
    summary: 'Refresh token',
    description: 'Get new access token using refresh token',
  })
  @ApiResponse({ status: 201, description: 'Token refreshed successfully' })
  @ApiResponse({ status: 401, description: 'Invalid refresh token' })
  refreshToken(@Body() dto: CredentialsDto) {
    return this.authService.refreshToken(dto);
  }

  @Roles(Role.ADMIN, Role.SUPER_ADMIN)
  @Get('policies/subject')
  @ApiOperation({
    summary: 'Get policy subjects',
    description: 'Get available policy subjects (admin only)',
  })
  @ApiResponse({ status: 200, description: 'Subjects retrieved successfully' })
  async getPoliciesSubjects() {
    return Object.values(Subject);
  }

  // Google OAuth endpoints
  @Public()
  @Get('google')
  @UseGuards(AuthGuard('google'))
  @ApiOperation({
    summary: 'Google OAuth',
    description: 'Initiate Google OAuth authentication flow',
  })
  @ApiResponse({
    status: 302,
    description: 'Redirects to Google consent screen',
  })
  async googleAuth() {
    // Initiates Google OAuth flow - handled by GoogleStrategy
    // This endpoint will redirect to Google's consent screen
  }

  @Public()
  @Get('google/callback')
  @UseGuards(AuthGuard('google'))
  @ApiOperation({
    summary: 'Google OAuth callback',
    description: 'Handle Google OAuth callback and authenticate user',
  })
  @ApiResponse({
    status: 200,
    description: 'Successfully authenticated with Google',
  })
  async googleAuthCallback(@Req() req: any) {
    // Google strategy validates and returns user profile
    return await this.authService.validateGoogleUser(req.user);
  }

  // Facebook OAuth endpoints
  @Public()
  @Get('facebook')
  @UseGuards(AuthGuard('facebook'))
  @ApiOperation({
    summary: 'Facebook OAuth',
    description: 'Initiate Facebook OAuth authentication flow',
  })
  @ApiResponse({ status: 302, description: 'Redirects to Facebook login' })
  async facebookAuth() {
    // Initiates Facebook OAuth flow - handled by FacebookStrategy
  }

  @Public()
  @Get('facebook/callback')
  @UseGuards(AuthGuard('facebook'))
  @ApiOperation({
    summary: 'Facebook OAuth callback',
    description: 'Handle Facebook OAuth callback and authenticate user',
  })
  @ApiResponse({
    status: 200,
    description: 'Successfully authenticated with Facebook',
  })
  async facebookAuthCallback(@Req() req: any) {
    // Facebook strategy validates and returns user profile
    return await this.authService.validateFacebookUser(req.user);
  }

  // Apple Sign In endpoints
  @Public()
  @Post('apple')
  @UseGuards(AuthGuard('apple'))
  @ApiOperation({
    summary: 'Apple Sign In',
    description: 'Initiate Apple Sign In authentication flow',
  })
  @ApiResponse({ status: 200, description: 'Apple Sign In initiated' })
  async appleAuth() {
    // Initiates Apple Sign In flow - handled by AppleStrategy
  }

  @Public()
  @Post('apple/callback')
  @UseGuards(AuthGuard('apple'))
  @ApiOperation({
    summary: 'Apple Sign In callback',
    description: 'Handle Apple Sign In callback and authenticate user',
  })
  @ApiResponse({
    status: 200,
    description: 'Successfully authenticated with Apple',
  })
  async appleAuthCallback(@Req() req: any) {
    // Apple strategy validates and returns user profile
    return await this.authService.validateAppleUser(req.user);
  }

  @Post('logout')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Logout',
    description: 'Logout user and invalidate session',
  })
  @ApiResponse({ status: 200, description: 'Successfully logged out' })
  async logout(@AuthUser() user: AuthUserDto) {
    await this.authService.logout(user);
    return { success: true };
  }
}
