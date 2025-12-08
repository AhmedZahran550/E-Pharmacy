import constants from '@/common/constants';
import { ErrorCodes } from '@/common/error-codes';
import { FieldError } from '@/common/models/error-response';
import { handleError } from '@/database/db.errors';
import { User, UserStatus, UserType } from '@/database/entities/user.entity';
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
import { Client, CredentialsDto } from './dto/credentials.dto';
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
    if (dto.grant_type === 'password') {
      return await this.signInWithCredentials(dto);
    } else if (dto.grant_type === 'guest') {
      return await this.signInAsGuest();
    } else if (dto.grant_type === 'refresh_token') {
      return await this.refreshToken(dto);
    } else if (dto.grant_type === 'otp') {
      return await this.signInWithOTP(dto);
    } else {
      throw new BadRequestException([
        {
          property: 'grant_type',
          code: ErrorCodes.INVALID_CLIENT,
        },
      ]);
    }
  }

  async identityConfirmation(
    data: IdentityConfirmationDto,
    authUser: AuthUserDto,
  ) {
    const currentUser = await this.usersService.findById(authUser.id, {
      select: ['identityConfirmedTrials', 'nationalId', 'id'],
    });

    if (currentUser.identityConfirmedTrials > 3) {
      throw new BadRequestException([
        {
          property: 'identityId',
          code: ErrorCodes.MAX_TRIALS_EXCEEDED,
        },
      ]);
    }
    const identityId = hmacHashing(data.identityId);
    if (data.identityConfirmed) {
      if (identityId === currentUser.nationalId) {
        await this.usersService.update(authUser.id, {
          identityConfirmed: true,
        });
      } else {
        let identityConfirmedTrials = currentUser.identityConfirmedTrials ?? 0;
        await this.usersService.update(authUser.id, {
          identityConfirmedTrials:
            (currentUser.identityConfirmedTrials ?? 0) + 1,
          locked: identityConfirmedTrials > 2,
          lockedAt: identityConfirmedTrials > 2 ? new Date() : undefined,
        });
        throw new BadRequestException([
          {
            property: 'identityId',
            code: ErrorCodes.INVALID_IDENTITY,
          },
        ]);
      }
    } else {
      return await this.usersService.update(currentUser.id, {
        identityConfirmed: false,
      });
    }
  }

  async signUp(signUpDto: SignUpDto) {
    try {
      signUpDto.isPrincipal = true;
      const whiteList = this.config
        .get('SIGNUP_MOBILE_NUMBERS_WHITE_LIST')
        ?.split(',') as string[];
      if (whiteList && whiteList.length > 0) {
        const isWhitelisted = whiteList.includes(signUpDto.mobile);
        if (!isWhitelisted) {
          throw new ForbiddenException([
            {
              property: 'mobile',
              message: 'Mobile number is not whitelisted',
              code: ErrorCodes.MOBILE_NOT_WHITELISTED,
            },
          ]);
        }
      }
      await this.checkUserExists(signUpDto);
      const newUser = await this.usersService.create(signUpDto);
      if (newUser.email && !newUser.emailVerified) {
        await this.sendEmailVerification(newUser);
      }
      const otp = await this.otpService.sendOtp(newUser);
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
      .addSelect('user.passportId')
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
      return dto.username === username && dto.password === password;
    } else {
      return (
        dto.username === process.env.ADMIN_EMAIL &&
        dto.password === process.env.ADMIN_PASSWORD
      );
    }
  }

  async signInWithCredentials(dto: CredentialsDto) {
    try {
      if (this.isSuperAdmin(dto)) {
        return await this.getAdminToken(dto);
      }
      const employee = await this.fetchAndVerifyEmployee(dto);
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

  async signInWithOTP(dto: CredentialsDto) {
    try {
      await this.otpService.verifyOtp(dto.mobile, dto.otp);

      const user = await this.getAuthUser({ mobile: dto.mobile });

      if (!user) {
        throw new BadRequestException([
          {
            property: 'mobile',
            code: ErrorCodes.USER_NOT_FOUND,
          },
        ]);
      }
      if (user.status !== UserStatus.ACTIVE) {
        throw new ForbiddenException({
          message: 'User is not active',
          code: ErrorCodes.NO_ACTIVE_SUBSCRIPTION,
        });
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
      } else if (
        payload.clients.includes(Client.PROVIDER) ||
        payload.clients.includes(Client.CUSTOMER)
      ) {
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
    const qb = await this.usersService
      .getQueryBuilder({ alias: 'user' })
      .leftJoinAndSelect('user.subscriptions', 'subscription')
      .leftJoin('subscription.plan', 'plan')
      .leftJoin('subscription.orders', 'orders')
      .leftJoinAndSelect('user.owner', 'owner')
      .leftJoin('owner.subscriptions', 'ownerSubscription')
      .leftJoin('ownerSubscription.plan', 'ownerPlan')
      .leftJoin('ownerSubscription.orders', 'ownerOrders')
      .addSelect([
        'orders.id',
        'orders.status',
        'plan.id',
        'plan.localizedName.en',
        'plan.localizedName.ar',
        'ownerOrders.id',
        'ownerOrders.status',
        'ownerPlan.id',
        'ownerPlan.localizedName.en',
        'ownerPlan.localizedName.ar',
        'subscription.id',
        'subscription.startDate',
        'subscription.endDate',
        'subscription.status',
        'ownerSubscription.id',
        'ownerSubscription.startDate',
        'ownerSubscription.endDate',
        'ownerSubscription.status',
      ]);

    // Sort user's direct subscriptions by endDate descending
    qb.orderBy('subscription.endDate', 'DESC');
    // Sort owner's subscriptions by endDate descending
    qb.addOrderBy('ownerSubscription.endDate', 'DESC');
    if (filters) {
      for (const key in filters) {
        const value = filters[key];
        qb.andWhere(`user.${key} = :${key}`, { [key]: value });
      }
    }
    return qb.getOne();
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
    if (!user.mobileVerified) {
      user.mobileVerified = true;
    }
    user.lastLoginDate = new Date();
    await this.usersService.update(user.id, user);
    const authUser = new AuthUserDto(user);
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
      clients: [Client.PROVIDER],
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
      clients: [Client.ADMIN_PORTAL, Client.PROVIDER_PORTAL],
    };
    const token = await this.generateToken(payload);
    return { ...token, user };
  }

  private async fetchAndVerifyEmployee(dto: CredentialsDto) {
    const employee = await this.employeesService.findByEmail(dto.username, [
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
    if (employee.roles.includes(Role.CUSTOMER_USER)) {
      payload = {
        sub: employee.id,
        roles: employee.roles,
        policies,
        email: employee.email,
        clients: [Client.CUSTOMER],
      };
    } else if (employee.roles.includes(Role.PROVIDER_USER)) {
      payload = {
        sub: employee.id,
        roles: employee.roles,
        email: employee.email,
        policies,
        branchId: employee.branch?.id,
        providerId: employee.branch?.provider.id,
        clients: [Client.CUSTOMER],
      };
    } else if (employee.roles.includes(Role.ADMIN)) {
      payload = {
        sub: employee.id,
        roles: employee.roles,
        policies,
        email: employee.email,
        clients: [Client.ADMIN_PORTAL],
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
        clients: [Client.Pharmacy_PORTAL],
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
}
