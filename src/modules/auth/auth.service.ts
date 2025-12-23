import constants from '@/common/constants';
import { ErrorCodes } from '@/common/error-codes';
import { FieldError } from '@/common/models/error-response';
import { handleError } from '@/database/db.errors';
import { AuthProvider, User } from '@/database/entities/user.entity';
import { LocalizationService } from '@/i18n/localization.service';
import { IdentityConfirmationDto } from '@/modules/auth/dto/identity-confirmation.dto';
import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  Logger,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JsonWebTokenError, JwtService } from '@nestjs/jwt';
import * as argon from 'argon2';
import { differenceInYears, sub } from 'date-fns';
import { v4 as uuid } from 'uuid';
import { EmployeesService } from '../employees/employees.service';
import { UsersService } from '../users/users.service';
import { AuthUserDto } from './dto/auth-user.dto';
import { Client, CredentialsDto, GrantType } from './dto/credentials.dto';
import { SignUpDto } from './dto/signup.dto';
import { OtpService } from './otp.service';
import { Role } from './role.model';
import {
  AdminTokenPayload,
  CustomerTokenPayload,
  ProviderTokenPayload,
  TokenPayload,
} from './dto/token.dto';
import { Employee } from '@/database/entities/employee.entity';
import { DeviceToken } from '@/database/entities/device-token.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { logger } from 'nestjs-i18n';
import { EmailService } from './../../common/mailer/email.service';
import { actionMap, Policy } from './policies.types';
import { hmacHashing } from '@/common/hmac-hashing';
import { GoogleProfile } from './strategies/google.strategy';
import { FacebookProfile } from './strategies/facebook.strategy';
import { AppleProfile } from './strategies/apple.strategy';
import { VerifyOTPDto } from './dto/otp.dto';
@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);
  constructor(
    @InjectRepository(DeviceToken)
    public appTokenRepository: Repository<DeviceToken>,
    private usersService: UsersService,
    private employeesService: EmployeesService,
    private otpService: OtpService,
    private jwtService: JwtService,
    private config: ConfigService,
    private emailService: EmailService,
    private readonly i18n: LocalizationService,
  ) {}

  async sendOtp(mobile: string) {
    try {
      const user = await this.usersService.findOne({
        where: { mobile },
      });
      if (!user) {
        const errors: FieldError[] = [
          {
            property: 'mobile',
            code: ErrorCodes.MOBILE_NOT_FOUND,
            message: this.i18n.t('errors.MOBILE_NOT_FOUND'),
            value: mobile,
          },
        ];
        throw new BadRequestException(errors);
      }
      await this.otpService.sendOtp(user);
    } catch (error) {
      this.logger.error(error);
      handleError(error);
    }
  }

  async signIn(dto: CredentialsDto) {
    if (dto.grant_type === 'password' && dto.client_id === Client.PORTAL) {
      return await this.signInPortalUser(dto);
    } else if (dto.grant_type === 'guest') {
      return await this.signInAsGuest();
    } else if (dto.grant_type === 'refresh_token') {
      return await this.refreshToken(dto);
    } else if (dto.client_id === Client.MOBILE_APP) {
      return await this.signInMobileApp(dto);
    } else {
      throw new BadRequestException([
        {
          property: 'grant_type',
          code: ErrorCodes.INVALID_CLIENT,
        },
      ]);
    }
  }

  async signUp(signUpDto: SignUpDto) {
    try {
      signUpDto.isPrincipal = true;
      await this.checkUserExists(signUpDto);
      const newUser = await this.usersService.create(signUpDto);
      if (newUser.email && !newUser.emailVerified) {
        this.sendEmailVerification(newUser).catch((err) =>
          this.logger.error(
            `Failed to send verification email for user ${newUser.id}`,
            err,
          ),
        );
      }
      this.otpService
        .sendOtp(newUser)
        .catch((err) =>
          this.logger.error(`Failed to send OTP for user ${newUser.id}`, err),
        );
      const user = new AuthUserDto(newUser);
      // const tokens = await this.generateToken(user);
      return { user };
    } catch (error) {
      handleError(error);
    }
  }

  async checkUserExists(signUpDto: SignUpDto) {
    const nationalId =
      signUpDto.nationalId && hmacHashing(signUpDto.nationalId);
    const qb = this.usersService.repository
      .createQueryBuilder('user')
      .addSelect('user.nationalId')
      .where('user.nationalId = :nationalId  OR user.mobile = :mobile', {
        nationalId,
        mobile: signUpDto.mobile,
      });
    const existingUsers = await qb.getMany();
    if (existingUsers.length > 0) {
      for (const user of existingUsers) {
        if (nationalId && user.nationalId === nationalId && user.idVerified) {
          throw new BadRequestException([
            {
              property: 'nationalId',
              code: ErrorCodes.NATIONAL_ID_ALREADY_EXISTS,
            },
          ]);
        }
        if (user.email === signUpDto.email) {
          throw new BadRequestException([
            {
              property: 'email',
              code: ErrorCodes.EMAIL_ALREADY_EXIST,
            },
          ]);
        }
        if (user.mobile === signUpDto.mobile && user.mobileVerified) {
          throw new BadRequestException([
            {
              property: 'mobile',
              code: ErrorCodes.MOBILE_ALREADY_EXISTS,
            },
          ]);
        } else if (user.mobile === signUpDto.mobile) {
          await this.usersService.delete(user.id);
        }
      }
    }
  }

  private isSuperAdmin(dto: CredentialsDto) {
    const credentials = process.env.ADMIN_CREDENTIALS;
    if (credentials) {
      const [username, password] = credentials.split(':');
      return dto.email === username && dto.password === password;
    } else {
      return (
        dto.email === process.env.ADMIN_EMAIL &&
        dto.password === process.env.ADMIN_PASSWORD
      );
    }
  }

  async signInPortalUser(dto: CredentialsDto) {
    try {
      if (this.isSuperAdmin(dto)) {
        return await this.getAdminToken(dto);
      }
      const employee = await this.fetchAndVerifyEmployee(dto);
      // Set employee as online
      await this.employeesService.update(employee.id, {
        isOnline: true,
        lastActiveAt: new Date(),
      } as any);
      return await this.employeeToAuthUser(employee);
    } catch (error) {
      this.logger.error(error);
      handleError(error);
    }
  }

  async signInAsGuest() {
    const user = new User();
    user.id = uuid();
    user.roles = [Role.GUEST];
    const payload: TokenPayload = {
      sub: user.id,
      roles: user.roles,
      clients: [Client.MOBILE_APP],
    };
    const token = await this.generateToken(payload);
    return { ...token, user: user };
  }

  async signInMobileApp(dto: CredentialsDto) {
    try {
      if (dto.grant_type === GrantType.OTP) {
        await this.otpService.verifyOtp(dto.mobile, dto.otp);
      }
      const filters = dto.mobile
        ? { mobile: dto.mobile }
        : { email: dto.email };
      const user = await this.getAuthUser(filters);
      if (dto.grant_type === GrantType.PASSWORD) {
        await this.verifyUserPassword(dto, user);
      }
      const authResponse = await this.getAuthResponse(user);
      if (dto.device_token) {
        await this.appTokenRepository.upsert(
          {
            deviceToken: dto.device_token,
            deviceInfo: dto.device_info,
            user,
          },
          { conflictPaths: ['deviceToken', 'user'] },
        );
      }
      return authResponse;
    } catch (error) {
      this.logger.error(error);
      throw error;
    }
  }

  public async refreshToken(dto: CredentialsDto) {
    try {
      const refreshToken = dto.refresh_token;
      const payload = await this.jwtService.verifyAsync(refreshToken, {
        secret: this.config.get('jwt.refreshToken.secret'),
      });
      if (payload.clients.includes(Client.MOBILE_APP)) {
        const user = await this.getAuthUser({ id: payload.sub });
        const resp = await this.getAuthResponse(user);
        if (dto.device_token) {
          await this.appTokenRepository.upsert(
            {
              deviceToken: dto.device_token,
              deviceInfo: dto.device_info,
              user,
            },
            { conflictPaths: ['deviceToken', 'user'] },
          );
        }
        return resp;
      } else if (payload.clients.includes(Client.PORTAL)) {
        const employee = await this.employeesService.findByEmail(payload.email);
        this.VerifyEmployee(employee);
        const resp = await this.employeeToAuthUser(employee);
        return resp;
      }
    } catch (error) {
      if (error instanceof JsonWebTokenError) {
        throw new UnauthorizedException({
          message: 'Invalid token',
          code: 'INVALID_TOKEN',
        });
      }
      this.logger.error(error);
      handleError(error);
    }
  }

  private async getAuthUser(filters: Record<string, any>) {
    const qb = this.usersService
      .getQueryBuilder({ alias: 'user' })
      .leftJoinAndSelect('user.owner', 'owner')
      .addSelect(['user.password']);
    if (filters) {
      for (const key in filters) {
        const value = filters[key];
        qb.andWhere(`user.${key} = :${key}`, { [key]: value });
      }
    }
    return qb.getOneOrFail();
  }

  private verifyUserAccess(user: User) {
    if (!user) {
      throw new BadRequestException([
        {
          property: 'user',
          code: ErrorCodes.USER_NOT_FOUND,
        },
      ]);
    }
    if (user.disabled) {
      throw new ForbiddenException({
        message: 'User is disabled',
        code: ErrorCodes.USER_DISABLED,
      });
    }
    if (user.locked) {
      throw new ForbiddenException({
        message: 'User is locked',
        code: ErrorCodes.USER_LOCKED,
      });
    }

    if (!this.isAtLeast15YearsOld(user.birthDate)) {
      throw new BadRequestException([
        {
          property: 'birthDate',
          message: 'User is under 15 years old',
          code: ErrorCodes.UNDER_15_YEARS,
        },
      ]);
    }
  }

  private async getAuthResponse(user: User) {
    this.verifyUserAccess(user);
    user.lastLoginDate = new Date();
    await this.usersService.update(user.id, user);
    const payload: TokenPayload = {
      sub: user.id,
      roles: user.roles,
      clients: [Client.MOBILE_APP],
    };
    const tokens = await this.generateToken(payload);
    return { ...tokens, user };
  }

  async generateAppUserToken(user: AuthUserDto) {
    const payload: TokenPayload = {
      sub: user.id,
      roles: user.roles,
      clients: [Client.MOBILE_APP],
    };
    return await this.generateToken(payload);
  }

  async generateProviderUserToken(user: AuthUserDto) {
    const payload: ProviderTokenPayload = {
      sub: user.id,
      roles: user.roles,
      email: user.email,
      branchId: user.branch?.id,
      providerId: user.branch?.provider?.id,
      clients: [Client.PORTAL],
    };
    return await this.generateToken(payload);
  }

  async generateToken(payload: TokenPayload) {
    const accessTokenExpiresIn = this.config.get('jwt.accessToken.expiresIn');
    const access_token = this.jwtService.sign(payload, {
      secret: this.config.get('jwt.accessToken.secret'),
      expiresIn: accessTokenExpiresIn,
    });

    const refresh_token = await this.jwtService.signAsync(payload, {
      secret: this.config.get('jwt.refreshToken.secret'),
      expiresIn: this.config.get('jwt.refreshToken.expiresIn'),
    });
    // calculate expiredAt by adding accessTokenExpiresIn to current time
    const expireAt = new Date(Date.now() + Number(accessTokenExpiresIn) * 1000);

    return {
      access_token,
      refresh_token,
      expireAt,
    };
  }

  isAtLeast15YearsOld(birthDate: Date): boolean {
    const today = new Date();

    // Calculate the difference in years
    const age = differenceInYears(today, birthDate);
    return age >= 15;
  }

  private async getAdminToken(dto: CredentialsDto) {
    const id = uuid();
    const user: Partial<AuthUserDto> = {
      id,
      email: process.env.ADMIN_EMAIL,
      firstName: 'super',
      lastName: 'admin',
      roles: [Role.ADMIN, Role.SUPER_ADMIN],
    };
    const payload: AdminTokenPayload = {
      sub: id,
      email: user.email,
      roles: user.roles,
      clients: [Client.PORTAL, Client.PORTAL],
    };
    const token = await this.generateToken(payload);
    return { ...token, user };
  }

  private async fetchAndVerifyEmployee(dto: CredentialsDto) {
    const employee = await this.employeesService.findByEmail(dto.email, [
      'password',
    ]);
    this.VerifyEmployee(employee);
    const matched = await argon.verify(employee.password, dto.password);
    if (!matched) {
      throw new UnauthorizedException({
        message: 'Invalid credentials',
        code: ErrorCodes.INVALID_CREDENTIALS,
      });
    }
    delete employee.password;
    return employee;
  }
  private async verifyUserPassword(dto: CredentialsDto, user: User) {
    if (!user.password) {
      let provider = user.provider;
      throw new UnauthorizedException({
        message: this.i18n.t('errors.SOCIAL_LOGIN_NO_PASSWORD', {
          args: { provider },
        }),
        code: ErrorCodes.SOCIAL_LOGIN_NO_PASSWORD,
        args: {
          provider,
        },
      });
    }

    const matched = await argon.verify(user.password, dto.password);
    if (!matched) {
      throw new UnauthorizedException({
        message: 'Invalid credentials',
        code: ErrorCodes.INVALID_CREDENTIALS,
      });
    }
    delete user.password;
    return user;
  }

  async verifyOtp(otpdto: VerifyOTPDto) {
    const otp = await this.otpService.verifyOtp(otpdto.mobile, otpdto.otp);
    const user = await this.getAuthUser({ mobile: otp.mobile });
    user.mobileVerified = true;
    const authResponse = await this.getAuthResponse(user);
    return authResponse;
  }

  private VerifyEmployee(employee: Employee) {
    if (!employee) {
      throw new UnauthorizedException({
        message: 'User not found',
        code: ErrorCodes.USER_NOT_FOUND,
      });
    }
    if (employee.disabled) {
      throw new ForbiddenException({
        message: 'User is disabled',
        code: ErrorCodes.USER_DISABLED,
      });
    }
    if (employee.locked) {
      throw new ForbiddenException({
        message: 'User is locked',
        code: ErrorCodes.USER_LOCKED,
      });
    }
  }

  async employeeToAuthUser(employee: Employee) {
    let payload:
      | ProviderTokenPayload
      | CustomerTokenPayload
      | AdminTokenPayload;
    let policies;
    if (employee.policies && employee.policies?.length > 0) {
      policies = this.serializePolicies(employee.policies);
    }
    if (employee.roles.includes(Role.PROVIDER_USER)) {
      payload = {
        sub: employee.id,
        roles: employee.roles,
        email: employee.email,
        policies,
        branchId: employee.branch?.id,
        providerId: employee.branch?.provider.id,
        clients: [Client.PORTAL],
      };
    } else if (employee.roles.includes(Role.ADMIN)) {
      payload = {
        sub: employee.id,
        roles: employee.roles,
        policies,
        email: employee.email,
        clients: [Client.PORTAL],
      };
    } else if (
      employee.roles.includes(Role.SYSTEM_ADMIN) ||
      employee.roles.includes(Role.SYSTEM_USER)
    ) {
      payload = {
        sub: employee.id,
        roles: employee.roles,
        policies,
        email: employee.email,
        clients: [Client.PORTAL],
      };
    } else {
      throw new BadRequestException([
        {
          property: 'client_id',
          code: ErrorCodes.INVALID_CLIENT,
        },
      ]);
    }
    const token = await this.generateToken(payload);
    const user = new AuthUserDto({
      ...employee,
      id: employee.id,
      branch: employee.branch?.id
        ? {
            id: employee.branch.id,
            name: employee.branch.localizedName,
            provider: { id: employee.branch.provider.id },
          }
        : undefined,
    });

    return { ...token, user };
  }
  async sendEmailVerification(user: User) {
    try {
      const payload = {
        sub: user.id,
        email: user.email,
      };
      const token = this.jwtService.sign(payload, {
        secret: this.config.get('jwt.resetToken.secret'),
        expiresIn: this.config.get('jwt.resetToken.expiresIn'),
      });
      await this.emailService.sendWelcomeEmail(user.email, token);
    } catch (error) {
      console.log(error);
      throw error;
    }
  }
  async verifyEmail(token: string) {
    try {
      const payload = await this.jwtService.verifyAsync(token, {
        secret: this.config.get('jwt.resetToken.secret'),
      });
      const user = await this.usersService.findOneOrFail({
        where: { id: payload.sub, email: payload.email },
      });
      user.emailVerified = true;
      await this.usersService.update(user.id, user);
      return { success: true };
    } catch (error) {
      throw new UnauthorizedException({
        message: 'Invalid token',
        code: ErrorCodes.INVALID_TOKEN,
      });
    }
  }

  /**
   * Validates Google OAuth user and returns auth response
   */
  async validateGoogleUser(profile: GoogleProfile) {
    return this.findOrCreateSocialUser({
      provider: AuthProvider.GOOGLE,
      providerId: profile.id,
      email: profile.email,
      firstName: profile.firstName,
      lastName: profile.lastName,
      photoUrl: profile.photo,
    });
  }

  /**
   * Validates Facebook OAuth user and returns auth response
   */
  async validateFacebookUser(profile: FacebookProfile) {
    return this.findOrCreateSocialUser({
      provider: AuthProvider.FACEBOOK,
      providerId: profile.id,
      email: profile.email,
      firstName: profile.firstName,
      lastName: profile.lastName,
      photoUrl: profile.photo,
    });
  }

  /**
   * Validates Apple Sign In user and returns auth response
   */
  async validateAppleUser(profile: AppleProfile) {
    return this.findOrCreateSocialUser({
      provider: AuthProvider.APPLE,
      providerId: profile.id,
      email: profile.email,
      firstName: profile.firstName || 'User',
      lastName: profile.lastName || '',
    });
  }

  /**
   * Finds existing user by provider ID or email, or creates a new user
   */
  private async findOrCreateSocialUser(data: {
    provider: AuthProvider;
    providerId: string;
    email: string;
    firstName: string;
    lastName: string;
    photoUrl?: string;
  }) {
    try {
      const { provider, providerId, email, firstName, lastName, photoUrl } =
        data;
      let user: User;

      // Define the provider ID field based on the provider
      const providerIdField =
        provider === AuthProvider.GOOGLE
          ? 'googleId'
          : provider === AuthProvider.FACEBOOK
            ? 'facebookId'
            : 'appleId';

      // Try to find user by provider ID
      user = await this.usersService.findOne({
        where: { [providerIdField]: providerId },
      });

      // If not found by provider ID, try to find by email
      if (!user && email) {
        user = await this.usersService.findOne({
          where: { email, emailVerified: true },
        });

        // If user exists with this email, link the social account
        if (user) {
          user[providerIdField] = providerId;
          if (!user.photoUrl && photoUrl) {
            user.photoUrl = photoUrl;
          }
          await this.usersService.update(user.id, user);
        }
      }

      // If user still doesn't exist, create a new one
      if (!user) {
        const newUserData: any = {
          email,
          firstName,
          lastName,
          provider,
          [providerIdField]: providerId,
          emailVerified: !!email, // Auto-verify email from OAuth provider
          roles: [Role.USER, Role.APP_USER],
          photoUrl,
          // Required fields - set defaults
          birthDate: sub(new Date(), { years: 15 }), // Default to 15 years ago
          gender: 'male', // Default gender
        };

        user = await this.usersService.create(newUserData);
      }

      // Generate tokens and return auth response
      const authResponse = await this.getAuthResponse(user);
      return authResponse;
    } catch (error) {
      this.logger.error('Social login error:', error);
      handleError(error);
    }
  }

  /**
   * Serializes an array of CASL policies into a compact string format.
   */
  private serializePolicies(policies: Policy[]): string[] {
    if (!policies) return [];
    return policies
      .map((policy) => {
        if (!policy.subject) return '';

        const actions =
          policy.actions
            ?.map((action) => actionMap[action] || action.charAt(0))
            .join(',') || '';

        return `${policy.subject}:${actions}`;
      })
      .filter((item) => item !== '');
  }

  /**
   * Logout handler - sets employee as offline if user is an employee
   * Distinguishes between app users and portal employees by checking roles
   */
  async logout(user: AuthUserDto) {
    // Check if user is an employee (portal user) by checking for employee-specific roles
    const employeeRoles = [
      Role.PROVIDER_USER,
      Role.PROVIDER_ADMIN,
      Role.SYSTEM_ADMIN,
      Role.SYSTEM_USER,
      Role.ADMIN,
    ];

    const isEmployee = user.roles?.some((role) => employeeRoles.includes(role));

    if (isEmployee) {
      // Set employee as offline
      await this.employeesService.update(user.id, {
        isOnline: false,
        lastActiveAt: new Date(),
      } as any);
    }

    // For app users, we don't need to do anything
    return { success: true };
  }
}
