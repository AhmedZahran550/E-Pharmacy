import { ErrorCodes } from '@/common/error-codes';
import { QueryOptions } from '@/common/query-options';
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
    private dataSource: DataSource,
  ) {}

  async addFamilyMember(userId: string, dto: CreateMemberDto) {
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
      // Get the principal user to verify family ownership
      const principalUser = await this.userRepository.findOne({
        where: { id: userId },
      });

      if (!principalUser || !principalUser.familyId) {
        throw new NotFoundException({
          message: 'User not found or not part of a family',
          code: ErrorCodes.USER_NOT_FOUND,
        });
      }

      // Get the family member
      const member = await this.userRepository.findOne({
        where: { id: memberId },
      });

      if (!member) {
        throw new NotFoundException({
          message: 'Family member not found',
          code: ErrorCodes.FAMILY_MEMBER_NOT_FOUND,
        });
      }

      // Verify the member belongs to the user's family
      if (member.familyId !== principalUser.familyId) {
        throw new ForbiddenException({
          message: "You don't have permission to manage this family member",
          code: ErrorCodes.FAMILY_MEMBER_UNAUTHORIZED,
        });
      }

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
      // Get the principal user to verify family ownership
      const principalUser = await this.userRepository.findOne({
        where: { id: userId },
      });

      if (!principalUser || !principalUser.familyId) {
        throw new NotFoundException({
          message: 'User not found or not part of a family',
          code: ErrorCodes.USER_NOT_FOUND,
        });
      }

      // Get the family member
      const member = await this.userRepository.findOneOrFail({
        where: { id: memberId },
      });
      // Verify the member belongs to the user's family
      if (member.familyId !== principalUser.familyId) {
        throw new ForbiddenException({
          message: "You don't have permission to manage this family member",
          code: ErrorCodes.FAMILY_MEMBER_UNAUTHORIZED,
        });
      }

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
}
