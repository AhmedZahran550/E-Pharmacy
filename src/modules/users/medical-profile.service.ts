import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, EntityManager, Repository } from 'typeorm';
import { MedicalProfile } from '@/database/entities/medical-profile.entity';
import { CreateMedicalProfileDto } from './dto/create-medical-profile.dto';
import { UpdateMedicalProfileDto } from './dto/update-medical-profile.dto';
import { User } from '@/database/entities/user.entity';

@Injectable()
export class MedicalProfileService {
  constructor(
    @InjectRepository(MedicalProfile)
    private medicalProfileRepository: Repository<MedicalProfile>,
    private dataSource: DataSource,
  ) {}

  async createInitialProfile(userId: string, manager: EntityManager) {
    // Check if profile already exists in current transaction to stay safe,
    // though usually this is called on new user creation.
    const existing = await manager.findOne(MedicalProfile, {
      where: { userId },
    });
    if (existing) return existing;

    const medicalProfile = manager.create(MedicalProfile, {
      userId,
      // Initialize with empty/default values if needed
    });

    return manager.save(MedicalProfile, medicalProfile);
  }

  async updateMedicalProfile(
    userId: string,
    updateMedicalProfileDto: UpdateMedicalProfileDto,
  ) {
    let medicalProfile = await this.medicalProfileRepository.findOne({
      where: { userId },
    });

    // Create profile if it doesn't exist
    if (!medicalProfile) {
      medicalProfile = this.medicalProfileRepository.create({
        userId,
        ...updateMedicalProfileDto,
      });
    } else {
      Object.assign(medicalProfile, updateMedicalProfileDto);
    }

    const savedProfile =
      await this.medicalProfileRepository.save(medicalProfile);

    // Check if profile is complete and update user flag
    await this.updateUserProfileCompletionStatus(userId, savedProfile);

    return savedProfile;
  }

  private async updateUserProfileCompletionStatus(
    userId: string,
    profile: MedicalProfile,
  ) {
    // Profile is complete when ALL fields are filled (not null/undefined)
    const isComplete =
      profile.bloodType != null &&
      profile.allergies != null &&
      profile.allergies.length > 0 &&
      profile.chronicConditions != null &&
      profile.chronicConditions.length > 0 &&
      profile.currentMedications != null &&
      profile.currentMedications.length > 0 &&
      profile.height != null &&
      profile.weight != null;
    if (isComplete) {
      await this.dataSource
        .getRepository(User)
        .update({ id: userId }, { isMedicalProfileCompleted: true });
    }
  }

  async getMedicalProfile(userId: string) {
    let medicalProfile = await this.medicalProfileRepository.findOne({
      where: { userId },
    });

    // Create profile if it doesn't exist
    if (!medicalProfile) {
      medicalProfile = this.medicalProfileRepository.create({ userId });
      medicalProfile = await this.medicalProfileRepository.save(medicalProfile);
    }

    return medicalProfile;
  }

  async deleteMedicalProfile(userId: string) {
    const medicalProfile = await this.medicalProfileRepository.findOne({
      where: { userId },
    });

    if (!medicalProfile) {
      throw new NotFoundException('Medical profile not found');
    }

    return this.medicalProfileRepository.softRemove(medicalProfile);
  }
}
