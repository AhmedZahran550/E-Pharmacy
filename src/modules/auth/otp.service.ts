import { ErrorCodes } from '@/common/error-codes';
import { FieldError } from '@/common/models/error-response';
import { QueryConfig } from '@/common/query-options';
import { handleError } from '@/database/db.errors';
import { DBService } from '@/database/db.service';
import { Otp } from '@/database/entities/otp.entity';
import { User } from '@/database/entities/user.entity';
import { LocalizationService } from '@/i18n/localization.service';
import { BadRequestException, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { isAfter, isBefore } from 'date-fns';
import { FilterOperator } from 'nestjs-paginate';
import { Repository } from 'typeorm';
import { UsersService } from '../users/users.service';
import { SMSService } from './sms.service';

const PAGINATION_CONFIG: QueryConfig<Otp> = {
  sortableColumns: ['mobile'],
  filterableColumns: {
    mobile: [FilterOperator.ILIKE],
  },
};

@Injectable()
export class OtpService extends DBService<Otp> {
  constructor(
    @InjectRepository(Otp)
    private otpRepository: Repository<Otp>,
    private config: ConfigService,
    private usersService: UsersService,
    private smsService: SMSService,
    private readonly i18n: LocalizationService,
  ) {
    super(otpRepository, PAGINATION_CONFIG);
  }

  async findOtpsSince(mobile: string, since: Date) {
    const qb = await this.otpRepository
      .createQueryBuilder('otp')
      .where('otp.createdAt >= :since', { since })
      .andWhere('otp.mobile = :mobile', { mobile });

    const otps = await qb.getMany();
    return otps;
  }

  async sendOtp(user: User) {
    const mobile = user.mobile;
    await this.checkRecentOtpRequests(mobile);

    const otp = this.generateOtp();
    const expireAt = new Date(Date.now() + 1 * 60 * 1000);
    const otpEntity = { mobile, code: otp, expireAt };
    await this.create(otpEntity);
    await this.smsService.send(mobile, otp.toString());
  }

  async verifyOtp(mobile: string, otp: string) {
    try {
      const OTP_MOBILE_WHITE_LIST = this.config.get('OTP_MOBILE_WHITELIST');
      if (
        OTP_MOBILE_WHITE_LIST &&
        OTP_MOBILE_WHITE_LIST.split(',').includes(mobile)
      ) {
        return;
      }

      const qb = this.otpRepository
        .createQueryBuilder('otp')
        .where('otp.mobile = :mobile', { mobile })
        .andWhere('otp.code = :code', { code: otp })
        .orderBy('otp.createdAt', 'DESC');
      const otpEntity = await qb.getOne();
      if (!otpEntity) {
        throw new BadRequestException([
          {
            property: 'otp',
            code: ErrorCodes.OTP_NOT_FOUND,
          },
        ]);
      }

      const validationError: FieldError = {
        property: 'otp',
        constraints: {
          otp: 'INVALID_OTP',
        },
        code: ErrorCodes.OTP_INVALID,
        message: 'Invalid OTP',
      };

      const oneMinuteAgo = new Date(Date.now() - 60 * 1000); // 1 minute ago
      if (isBefore(otpEntity.metadata.createdAt, oneMinuteAgo)) {
        validationError.code = ErrorCodes.OTP_EXPIRED;
        throw new BadRequestException([validationError]);
      }
      return otpEntity;
    } catch (error) {
      if (error instanceof BadRequestException) {
        throw error;
      }
      throw handleError(error);
    }
  }

  private generateOtp() {
    const otp = Math.floor(100000 + Math.random() * 900000);
    return String(999999);
    // return otp;
  }

  private async checkRecentOtpRequests(mobile: string) {
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000); // 1 hour ago
    const oneMinuteAgo = new Date(Date.now() - 60 * 1000); // 1 minute ago

    // Fetch all recent OTP requests within the last hour
    const recentOtps = await this.findOtpsSince(mobile, oneHourAgo);
    // Filter requests in the last minute
    const requestsLastMinute = recentOtps.filter((otp) =>
      isAfter(otp.metadata.createdAt, oneMinuteAgo),
    );

    if (requestsLastMinute.length > 0) {
      throw new BadRequestException([
        {
          property: 'mobile',
          code: ErrorCodes.OTP_LIMIT_EXCEEDED,
        },
      ]);
    }

    if (recentOtps.length >= 3) {
      throw new BadRequestException([
        {
          property: 'mobile',
          code: ErrorCodes.OTP_HOURLY_LIMIT_EXCEEDED,
        },
      ]);
    }
  }

  mapper(entity: Otp) {
    return entity;
  }
}
