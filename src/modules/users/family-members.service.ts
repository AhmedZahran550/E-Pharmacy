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
import { DataSource, Repository } from 'typeorm';
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
