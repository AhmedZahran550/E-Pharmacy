import { ErrorCodes } from '@/common/error-codes';
import { QueryOptions } from '@/common/query-options';
import { StorageService } from '@/common/storage.service';
import { User } from '@/database/entities/user.entity';
import { handleError } from '@/database/db.errors';
import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository, Brackets } from 'typeorm';
import { CreateMemberDto } from './dto/create-member.dto';
import { UpdateFamilyMemberDto } from './dto/update-family-member.dto';
import { UsersService } from './users.service';
import { MedicalProfileService } from './medical-profile.service';

@Injectable()
export class FamilyMembersService {
  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
    private usersService: UsersService,
    private medicalProfileService: MedicalProfileService,
    private storageService: StorageService,
    private dataSource: DataSource,
  ) {}

  private async getMemberIfAllowed(userId: string, memberId: string) {
    // Get the family member
    const member = await this.userRepository.findOne({
      where: { id: memberId, ownerId: userId },
    });

    if (!member) {
      throw new NotFoundException({
        message: 'Family member not found',
        code: ErrorCodes.FAMILY_MEMBER_NOT_FOUND,
      });
    }
    return member;
  }

  private async uploadMemberPhoto(file: Express.Multer.File, memberId: string) {
    const extension = file.originalname.split('.').pop().toLowerCase();
    const fileName = `family-member-${memberId}.${extension}`;
    const obj = await this.storageService.saveFile(file, fileName, 'profile');
    return obj.url;
  }

  async addFamilyMember(
    userId: string,
    dto: CreateMemberDto,
    file?: Express.Multer.File,
  ) {
    const queryRunner = await this.usersService.startTransaction(
      this.dataSource,
    );
    const manager = queryRunner.manager;

    try {
      // Get the principal user
      const principalUser = await this.userRepository.findOneOrFail({
        where: { id: userId },
      });

      // Ensure principal user has familyId
      let familyId = principalUser.familyId;
      if (!familyId) {
        familyId = this.usersService.generateFamilyId();
        principalUser.familyId = familyId;
        principalUser.is_principal = true;
        await manager.save(principalUser);
      }

      // Check for duplicates in the family (email or mobile)
      if (dto.email || dto.mobile) {
        const queryBuilder = manager.createQueryBuilder(User, 'user');
        queryBuilder.where('user.familyId = :familyId', { familyId });
        queryBuilder.andWhere(
          new Brackets((qb) => {
            if (dto.email && dto.mobile) {
              qb.where('user.email = :email', { email: dto.email }).orWhere(
                'user.mobile = :mobile',
                { mobile: dto.mobile },
              );
            } else if (dto.email) {
              qb.where('user.email = :email', { email: dto.email });
            } else if (dto.mobile) {
              qb.where('user.mobile = :mobile', { mobile: dto.mobile });
            }
          }),
        );

        const existingMember = await queryBuilder.getOne();

        if (existingMember) {
          if (dto.email && existingMember.email === dto.email) {
            throw new BadRequestException({
              message: 'Family member with this email already exists',
              code: ErrorCodes.EMAIL_ALREADY_EXIST,
            });
          }
          if (dto.mobile && existingMember.mobile === dto.mobile) {
            throw new BadRequestException({
              message: 'Family member with this mobile number already exists',
              code: ErrorCodes.MOBILE_ALREADY_EXISTS,
            });
          }
        }
      }

      // Create the family member
      const member = manager.create(User, {
        ...dto,
        ownerId: userId,
        familyId: familyId,
        is_principal: false,
        mobileVerified: false,
        emailVerified: false,
        idVerified: false,
      });

      if (file) {
        member.photoUrl = await this.uploadMemberPhoto(file, member.id);
      }

      const savedMember = await this.usersService.saveUser(
        member,
        userId,
        manager,
      );

      // Auto-create medical profile for the member
      await this.medicalProfileService.createInitialProfile(
        savedMember.id,
        manager,
      );

      await queryRunner.commitTransaction();
      return savedMember;
    } catch (error) {
      await queryRunner.rollbackTransaction();
      handleError(error);
    } finally {
      await queryRunner.release();
    }
  }

  async listFamilyMembers(userId: string, query: QueryOptions) {
    return this.usersService.findUserMembers(query, userId);
  }

  async updateFamilyMember(
    userId: string,
    memberId: string,
    dto: UpdateFamilyMemberDto,
  ) {
    try {
      const member = await this.getMemberIfAllowed(userId, memberId);

      // Prevent updating critical fields
      delete dto['ownerId'];
      delete dto['familyId'];
      delete dto['is_principal'];

      return this.usersService.update(memberId, dto);
    } catch (error) {
      handleError(error);
    }
  }

  async deleteFamilyMember(userId: string, memberId: string) {
    try {
      const member = await this.getMemberIfAllowed(userId, memberId);

      // Prevent deleting the principal user
      if (member.is_principal) {
        throw new BadRequestException({
          message: 'Cannot delete the principal family member',
          code: ErrorCodes.CANNOT_DELETE_PRINCIPAL,
        });
      }

      return this.usersService.softDelete(memberId);
    } catch (error) {
      handleError(error);
    }
  }

  async updateFamilyMemberPhoto(
    userId: string,
    memberId: string,
    file: Express.Multer.File,
  ) {
    try {
      const member = await this.getMemberIfAllowed(userId, memberId);
      const photoUrl = await this.uploadMemberPhoto(file, member.id);
      return this.usersService.update(memberId, { photoUrl });
    } catch (error) {
      handleError(error);
    }
  }
}
