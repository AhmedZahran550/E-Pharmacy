import {
  QueryConfig,
  QueryOneOptions,
  QueryOptions,
} from '@/common/query-options';
import { generateRandomDigitNumber } from '@/common/random-number.util';
import { DBService } from '@/database/db.service';
import { User } from '@/database/entities/user.entity';
import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { FilterOperator, FilterSuffix } from 'nestjs-paginate';
import {
  DataSource,
  EntityManager,
  FindManyOptions,
  FindOneOptions,
  Repository,
  UpdateResult,
} from 'typeorm';
import { UsersQueryDto } from '../auth/dto/users-query.dto';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { BaseEncoder } from '@/utils/base-encoder.util';
import { AuthUserDto } from '../auth/dto/auth-user.dto';
import { handleError } from '@/database/db.errors';
import { v4 as uuidv4 } from 'uuid';
import { VerifyUserIdDto } from './dto/VerifyUserIdDto.dto';
import { ErrorCodes } from '@/common/error-codes';
import { UserActionDto, UserActionType } from './dto/user-action.dto';
import { hmacHashing, hmacVerify } from '@/common/hmac-hashing';
import { MedicalProfileService } from './medical-profile.service';

export const USER_PAGINATION_CONFIG: QueryConfig<User> = {
  sortableColumns: ['email', 'firstName', 'lastName', 'mobile', 'code'],
  filterableColumns: {
    email: [FilterOperator.ILIKE],
    id: [FilterOperator.EQ],
    firstName: [FilterOperator.ILIKE],
    lastName: [FilterOperator.ILIKE],
    type: [FilterOperator.EQ],
    mobile: [FilterOperator.EQ],
    locked: [FilterOperator.EQ],
    disabled: [FilterOperator.EQ],
    staffId: [FilterOperator.NULL, FilterOperator.EQ, FilterSuffix.NOT],
    nid: [FilterOperator.EQ],
    gender: [FilterOperator.EQ],
    familyId: [FilterOperator.EQ],
    mobileVerified: [FilterOperator.EQ],
    isPrincipal: [FilterOperator.EQ],
    'subscriptions.endDate': [
      FilterOperator.GTE,
      FilterOperator.LTE,
      FilterOperator.EQ,
    ],
    'subscriptions.startDate': [
      FilterOperator.GTE,
      FilterOperator.LTE,
      FilterOperator.EQ,
    ],
  },
  searchableColumns: ['mobile', 'code'],
  defaultSortBy: [['metadata.createdAt', 'DESC']],
  loadEagerRelations: false,
};
@Injectable()
export class UsersService extends DBService<
  User,
  CreateUserDto,
  UpdateUserDto
> {
  constructor(
    @InjectRepository(User)
    public repository: Repository<User>,
    private dataSource: DataSource,
    private medicalProfileService: MedicalProfileService,
  ) {
    super(repository, USER_PAGINATION_CONFIG);
  }

  async checkUserExists(query: UsersQueryDto) {
    const qb = this.repository
      .createQueryBuilder()
      .where('mobile = :mobile AND mobile_verified = true', {
        mobile: query.mobile,
      })
      .orWhere('national_id = :identityId', { identityId: query.identityId })
      .orWhere('email = :email', { email: query.email })
      .addSelect(['nationalId', 'passportId']);
    const result = await qb.getMany();
    if (result.length > 0) {
      return {
        exists: true,
        fields: {
          mobile: !!result.find((user) => user.mobile === query.mobile),
          identityId: !!result.find(async (user) =>
            hmacVerify(user.nationalId, query.identityId),
          ),
          email: !!result.find((user) => user.email === query.email),
        },
      };
    } else {
      return {
        exists: false,
        fields: { mobile: false, identityId: false, email: false },
      };
    }
  }

  async findUserMembers(query: QueryOptions, id: string) {
    try {
      const dbUser = await this.repository.findOne({
        where: { id },
      });

      if (!dbUser) {
        throw new NotFoundException({
          message: 'User not found',
          code: ErrorCodes.USER_NOT_FOUND,
        });
      }

      const qb = this.repository
        .createQueryBuilder('user')
        .where('user.familyId = :familyId', { familyId: dbUser.familyId });
      return this.findAll(query, qb);
    } catch (error) {
      handleError(error);
    }
  }

  async create(createDto: CreateUserDto) {
    const queryRunner = await this.startTransaction(this.dataSource);
    const manager = queryRunner.manager;
    try {
      const user = manager.create(User, createDto);
      // user.metadata.createdBy = createDto.createdBy;
      const savedUser = await this.saveUser(user, createDto.createdBy, manager);
      // Auto-create medical profile
      await this.medicalProfileService.createInitialProfile(
        savedUser.id,
        manager,
      );

      await queryRunner.commitTransaction();
      return savedUser;
    } catch (error) {
      await queryRunner.rollbackTransaction();
      handleError(error);
    } finally {
      await queryRunner.release();
    }
  }

  async saveUser(user: User, savedBy: string, manager: EntityManager) {
    try {
      const rn = this.generateCode();
      // Generate a unique referral code
      let referralCode: string;
      let isUnique = false;

      while (!isUnique) {
        referralCode =
          'R' +
          BaseEncoder.encodeToBase62(
            user.id || crypto.randomUUID(),
          ).toUpperCase(); // Generate referral code
        const existingUser = await manager.findOneBy(User, {
          referralCode,
        });
        if (!existingUser) isUnique = true;
      }
      user.referralCode = referralCode;
      const userToSave = manager.create(User, {
        ...user,
        code: String(rn),
        metadata: {
          createdBy: savedBy,
        },
      });
      const SavedUser = await manager.save(User, userToSave);
      delete SavedUser.password;
      return SavedUser;
    } catch (error) {
      handleError(error);
    }
  }
  async findByNationalId(nationalId: string) {
    nationalId = hmacHashing(nationalId);
    const users = await this.repository.findBy({
      nationalId,
    });
    return users.map(this.mapper);
  }

  async findByEmail(email: string, fetchHiddenFields?: string[]) {
    const qb = await this.repository.createQueryBuilder('user');
    if (fetchHiddenFields?.length > 0) {
      fetchHiddenFields.forEach((field) => {
        qb.addSelect(`user.${field}`);
      });
    }
    qb.where('email = :email', { email });

    const entity = await qb.getOne();
    return this.mapper(entity);
  }

  async findByMobile(mobile: string, options?: FindOneOptions<User>) {
    const user = await this.repository.findOne({
      ...options,
      where: { mobile, ...options?.where },
    });
    if (!user) {
      throw new NotFoundException({
        message: 'User not found',
        code: ErrorCodes.USER_NOT_FOUND,
      });
    }
    return this.mapper(user);
  }

  async getCount(options?: FindManyOptions<User>) {
    return await this.repository.count(options);
  }
  async softDelete(id: string, options?: QueryOneOptions<User>) {
    const existingUser = await this.findOneOrFail({
      where: { id },
      ...options,
    });
    existingUser.disabled = true;
    existingUser.metadata.deletedAt = new Date();
    const deleted = await this.repository.save({
      ...existingUser,
      idVerified: false,
      mobileVerified: false,
      emailVerified: false,
      identityConfirmed: false,
    });
    return deleted;
  }

  async hashingIdes() {
    const users = await this.repository
      .createQueryBuilder('user')
      .addSelect('user.nationalId')
      .addSelect('user.passportId')
      .where('national_id_encrypted IS NULL AND passport_id_encrypted IS NULL')
      .getMany();
    await this.repository.save(users);
  }

  generateCode() {
    return generateRandomDigitNumber(1000000000, 9999999999);
  }

  mapper(user: User) {
    return user;
  }

  generateFamilyId() {
    return uuidv4();
  }
}
