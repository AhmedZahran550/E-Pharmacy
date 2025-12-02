import { QueryOptions } from '@/common/query-options';
import { DBService } from '@/database/db.service';
import { BranchAvailability } from '@/database/entities/branch-availability.entity';
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  AvailabilityListDto,
  CreateBranchAvailabilityDto,
} from './dto/create-availability.dto';
import { UpdateBranchAvailabilityDto } from './dto/update-availability.dto';
import { BranchesService } from './branches.service';

@Injectable()
export class BranchAvailabilityService extends DBService<
  BranchAvailability,
  CreateBranchAvailabilityDto,
  UpdateBranchAvailabilityDto
> {
  constructor(
    @InjectRepository(BranchAvailability)
    repository: Repository<BranchAvailability>,
    private readonly branchesService: BranchesService,
  ) {
    super(repository);
  }

  async findAllByBranchId(branchId: string) {
    const branch = await this.branchesService.findOne({
      where: { id: branchId },
      relations: ['availability'],
    });
    return {
      daysOfWeek: branch.availability,
      isAlwaysOpen: branch.isAlwaysOpen,
    };
  }

  async createBranchAvailability(
    bodyDto: AvailabilityListDto,
    branchId: string,
  ) {
    await this.repository.delete({ branch: { id: branchId } });
    if (bodyDto.isAlwaysOpen) {
      return await this.branchesService.update(branchId, {
        isAlwaysOpen: bodyDto.isAlwaysOpen,
      });
    }
    bodyDto.daysOfWeek.map((dto) => (dto.branch = { id: branchId }));
    const [availabilities] = await Promise.all([
      this.batchCreate(bodyDto.daysOfWeek),
      this.branchesService.update(branchId, {
        isAlwaysOpen: false,
      }),
    ]);
    return availabilities;
  }
}
