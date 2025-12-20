import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { EntityManager, Repository } from 'typeorm';
import { MedicalProfile } from '@/database/entities/medical-profile.entity';
import { CreateMedicalProfileDto } from './dto/create-medical-profile.dto';
import { UpdateMedicalProfileDto } from './dto/update-medical-profile.dto';

@Injectable()
export class MedicalProfileService {
  constructor(
    @InjectRepository(MedicalProfile)
    private medicalProfileRepository: Repository<MedicalProfile>,
  ) {}

  async createMedicalProfile(
    userId: string,
    createMedicalProfileDto: CreateMedicalProfileDto,
  ) {
    const existingProfile = await this.medicalProfileRepository.findOne({
      where: { userId },
    });

    if (existingProfile) {
      throw new BadRequestException('Medical profile already exists');
    }

    const medicalProfile = this.medicalProfileRepository.create({
      ...createMedicalProfileDto,
      userId,
    });

    return this.medicalProfileRepository.save(medicalProfile);
  }

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
    const medicalProfile = await this.medicalProfileRepository.findOne({
      where: { userId },
    });

    if (!medicalProfile) {
      // If auto-creation fails/didn't happen for some reason, we could create it here,
      // but strict update expects existence. Alternatively, upsert logic.
      throw new NotFoundException('Medical profile not found');
    }

    Object.assign(medicalProfile, updateMedicalProfileDto);
    return this.medicalProfileRepository.save(medicalProfile);
  }

  async getMedicalProfile(userId: string) {
    const medicalProfile = await this.medicalProfileRepository.findOne({
      where: { userId },
    });

    if (!medicalProfile) {
      throw new NotFoundException('Medical profile not found');
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
