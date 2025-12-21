import { StorageService } from '@/common/storage.service';
import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import * as path from 'path';
import { UsersService } from './users.service';
import { v4 as uuidv4 } from 'uuid';
import { ProfileNotificationsDto } from './dto/profile-notifications.dto';
import { User, UserPreferences } from '@/database/entities/user.entity';
import { EntityManager, In, Repository } from 'typeorm';
import { AuthUserDto } from '../auth/dto/auth-user.dto';
import { InjectRepository } from '@nestjs/typeorm';

import { OrdersService } from '../orders/orders.service';
import { OrderStatus } from '@/database/entities/order.entity';
import { decrypt } from '@/common/crypto';
import { UpdateUserDto } from './dto/update-user.dto';
import { ErrorCodes } from '@/common/error-codes';
import { validateEgyptianNationalId } from '@/common/nid-util';
import { isSameDay } from 'date-fns';
import { UpdatePreferencesDto } from './dto/update-preferences.dto';
import { MedicalProfile } from '@/database/entities/medical-profile.entity';
import { CreateMedicalProfileDto } from './dto/create-medical-profile.dto';
import { UpdateMedicalProfileDto } from './dto/update-medical-profile.dto';

@Injectable()
export class ProfileService {
  constructor(
    private storageService: StorageService,
    private usersService: UsersService,
    private orderService: OrdersService,
    @InjectRepository(MedicalProfile)
    private medicalProfileRepository: Repository<MedicalProfile>,
  ) {}

  async updateUserPreferences(
    userId: string,
    updatePreferencesDto: UpdatePreferencesDto,
  ): Promise<UserPreferences> {
    const user = await this.usersService.findOne({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Merge existing preferences with new ones
    user.preferences = {
      ...user.preferences,
      ...updatePreferencesDto,
    };

    // Sync with the legacy notificationsEnabled field if needed
    if (updatePreferencesDto.pushNotificationsEnabled !== undefined) {
      user.notificationsEnabled = updatePreferencesDto.pushNotificationsEnabled;
    }

    const savedUser = await this.usersService.repository.save(user);
    return savedUser.preferences;
  }

  async updateProfilePhoto(file: Express.Multer.File, userId: string) {
    try {
      const uuid = uuidv4();
      const fileName = `profile-${userId}-${uuid}`;
      const extension = path.extname(file.originalname).toLowerCase();
      const filePath = `${fileName}${extension}`;
      const obj = await this.storageService.saveFile(file, filePath, 'profile');
      const updatedUser =
        await this.usersService.repository.manager.transaction(
          async (manager) => {
            const user = await manager.findOneOrFail(User, {
              where: { id: userId },
            });
            // await this.checkAndRewardProfileCompletion(user, manager);
            user.photoUrl = obj.url;
            const savedUser = await manager.save(user);
            return savedUser;
          },
        );
      return { photoUrl: updatedUser.photoUrl };
    } catch (error) {
      console.error(error);
      throw error;
    }
  }

  toggleNotifications(
    userId: string,
    profileNotificationsDto: ProfileNotificationsDto,
  ) {
    return this.usersService.update(userId, {
      notificationsEnabled: profileNotificationsDto.enabled,
    });
  }

  async getUserProfile(userId: string) {
    const qb = this.usersService.repository
      .createQueryBuilder('user')
      .addSelect(['user.nationalIdEncrypted']); // Add hidden fields to selection
    qb.where('user.id = :userId', { userId });
    const { nationalIdEncrypted, ...user } = await qb.getOneOrFail();
    user.nationalId = nationalIdEncrypted ? decrypt(nationalIdEncrypted) : null;
    return user;
  }

  async updateProfile(user: AuthUserDto, body: UpdateUserDto) {
    console.log('Updating profile for user:', user.id);
    // fetch full profile (decrypted nationalId / passport) and current birthday/idVerified
    const profile = await this.getUserProfile(user.id);
    // If user's national id already verified => only allow email change
    if (profile.idVerified) {
      // allow only email key
      const allowed = ['email'];
      const providedKeys = Object.keys(body || {});
      const invalidKeys = providedKeys.filter((k) => !allowed.includes(k));
      if (invalidKeys.length > 0) {
        throw new ForbiddenException(
          'National ID is verified — only email can be changed',
        );
      }
      // proceed with email update
      return this.usersService.update(user.id, { email: body.email });
    }
    if (body.nationalId || body.birthDate) {
      const validnid = validateEgyptianNationalId(
        body.nationalId || profile.nationalId,
      );
      if (!isSameDay(validnid.birthDate, body.birthDate || profile.birthDate)) {
        throw new BadRequestException({
          message: 'National ID does not match birth date',
          code: ErrorCodes.NID_DOB_INCONSISTENCY,
        });
      }
    }
    delete body.mobile; // prevent mobile update through this method
    return this.usersService.update(user.id, body);
  }
}
