import { DBService } from '@/database/db.service';
import { Employee, EmployeeType } from '@/database/entities/employee.entity';
import { Branch } from '@/database/entities/branch.entity';
import { DoctorRating } from '@/database/entities/doctor-rating.entity';
import { User } from '@/database/entities/user.entity';
import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { CreateEmployeeDto } from './dto/create-employee.dto';
import { EmployeeDto } from './dto/employee.dto';
import { UpdateEmployeeDto } from './dto/update-employee.dto';
import { QueryOptions } from '@/common/query-options';
import { ErrorCodes } from '@/common/error-codes';
import { Role } from '../auth/role.model';
import { FilterOperator, PaginateConfig } from 'nestjs-paginate';
import { NearbyDoctorsDto } from './dto/nearby-doctors.dto';
import { StorageService } from '@/common/storage.service';
import * as path from 'path';

export const DOCTORS_PAGINATION_CONFIG: PaginateConfig<Employee> = {
  sortableColumns: ['firstName', 'lastName', 'isOnline'],
  filterableColumns: {
    isOnline: [FilterOperator.EQ],
    'branch.id': [FilterOperator.EQ],
    gender: [FilterOperator.EQ],
  },
  searchableColumns: ['firstName', 'lastName'],
  maxLimit: 100,
  defaultLimit: 20,
};

@Injectable()
export class EmployeesService extends DBService<
  Employee,
  CreateEmployeeDto,
  UpdateEmployeeDto,
  EmployeeDto
> {
  constructor(
    @InjectRepository(Employee)
    protected repository: Repository<Employee>,
    @InjectRepository(Branch)
    private branchRepository: Repository<Branch>,
    private dataSource: DataSource,
    private storageService: StorageService,
  ) {
    super(repository, DOCTORS_PAGINATION_CONFIG);
  }

  async create(data: CreateEmployeeDto) {
    // Check if branch has a maximum employee limit
    if (data.branch?.id) {
      const branch = await this.branchRepository.findOne({
        where: { id: data.branch.id },
        select: ['id', 'maxEmployees'],
      });

      if (branch?.maxEmployees) {
        // Count current employees for this branch
        const currentEmployeeCount = await this.repository.count({
          where: { branch: { id: data.branch.id } },
        });

        if (currentEmployeeCount >= branch.maxEmployees) {
          throw new BadRequestException([
            {
              property: 'branch',
              code: ErrorCodes.MAX_EMPLOYEES_REACHED,
              message: `Cannot add more employees. Branch has reached its maximum limit of ${branch.maxEmployees} employees.`,
            },
          ]);
        }
      }
    }
    if (data.type === EmployeeType.PROVIDER) {
      data.roles = [...data.roles, Role.PROVIDER_USER];
    }
    const employee = await super.create({
      ...data,
      metadata: {
        createdBy: data.createdBy,
      },
    } as any);

    delete employee.password;
    return employee;
  }

  async findByEmail(email: string, fetchHiddenFields?: string[]) {
    const qb = await this.repository.createQueryBuilder('employee');
    if (fetchHiddenFields?.length > 0) {
      fetchHiddenFields.forEach((field) => {
        qb.addSelect(`employee.${field}`);
      });
    }
    // Include the branch relationship to fetch branchId
    qb.leftJoinAndSelect('employee.branch', 'branch');
    qb.leftJoinAndSelect('branch.provider', 'provider');
    qb.where('email = :email', { email });

    const entity = await qb.getOne();
    return entity;
  }

  async findSystemEmployees(option: QueryOptions) {
    const qb = this.repository
      .createQueryBuilder('employee')
      .where('employee.type = "system"');
    return await super.findAll(option, qb);
  }
  async findProviderEmployees(providerId: string, option?: QueryOptions) {
    const qb = this.repository.createQueryBuilder('employee');
    qb.leftJoin('employee.branch', 'branch');
    qb.leftJoin('branch.provider', 'provider');
    qb.where('provider.id = :providerId', { providerId }).andWhere(
      'employee.type = "provider"',
    );
    return await super.findAll(option, qb);
  }

  mapper(entity: Employee) {
    return entity as any as EmployeeDto;
  }

  async delete(id: string, options?: any): Promise<void> {
    // Call parent delete - doctorsCount is handled by database trigger
    await super.softDelete(id, options);
  }

  /**
   * Find doctors with filters for app users
   */
  async findDoctors(options: QueryOptions) {
    const qb = this.repository
      .createQueryBuilder('employee')
      .leftJoinAndSelect('employee.branch', 'branch')
      .leftJoinAndSelect('branch.provider', 'provider')
      .leftJoinAndSelect('branch.city', 'city')
      .where('employee.type = :type', { type: EmployeeType.PROVIDER })
      .andWhere("employee.roles::text[] @> ARRAY['provider_doctor']")
      .andWhere('employee.disabled = false')
      .andWhere('employee.locked = false')
      .select([
        'employee.id',
        'employee.firstName',
        'employee.lastName',
        'employee.gender',
        'employee.isOnline',
        'employee.averageRating',
        'employee.totalRaters',
        'branch.id',
        'branch.name_en',
        'branch.name_ar',
        'branch.address_en',
        'branch.address_ar',
        'branch.latitude',
        'branch.longitude',
        'provider.id',
        'provider.name_en',
        'provider.name_ar',
        'city.id',
        'city.name_en',
        'city.name_ar',
      ])
      .addSelect('employee.created_at', 'employee_created_at');

    return await super.findAll(options, qb);
  }

  /**
   * Find nearby doctors based on location with optional online filter and pagination
   */
  async findNearbyDoctors(params: NearbyDoctorsDto) {
    const {
      lat,
      lng,
      radius = 10,
      isOnline,
      page,
      limit,
      search,
      filter,
    } = params;

    const radiusMeters = radius * 1000;

    let qb = this.repository
      .createQueryBuilder('employee')
      .leftJoinAndSelect('employee.branch', 'branch')
      .leftJoinAndSelect('branch.provider', 'provider')
      .leftJoinAndSelect('branch.city', 'city')
      .where('employee.type = :type', { type: EmployeeType.PROVIDER })
      .andWhere("employee.roles::text[] @> ARRAY['provider_doctor']")
      .andWhere('employee.disabled = false')
      .andWhere('employee.locked = false')
      .andWhere(
        `ST_DWithin(
          branch.location,
          ST_SetSRID(ST_MakePoint(:lng, :lat), 4326)::geography,
          :radius
        )`,
        { lat, lng, radius: radiusMeters },
      );

    // Add distance calculation
    qb = qb.addSelect(
      `ST_Distance(
        branch.location,
        ST_SetSRID(ST_MakePoint(:lng, :lat), 4326)::geography
      ) / 1000`,
      'distance',
    );

    // Apply search if provided
    if (search) {
      qb = qb.andWhere(
        `(employee.firstName ILIKE :search OR employee.lastName ILIKE :search)`,
        { search: `%${search}%` },
      );
    }

    // Apply filters if provided
    if (filter) {
      Object.entries(filter).forEach(([key, value]) => {
        if (key === 'branch.id') {
          qb = qb.andWhere(`branch.id = :branchId`, { branchId: value });
        } else if (key === 'gender') {
          qb = qb.andWhere(`employee.gender = :gender`, { gender: value });
        }
      });
    }

    // Apply online filter if specified
    if (isOnline !== undefined) {
      qb = qb.andWhere('employee.isOnline = :isOnline', { isOnline });
    }

    // Add the select for specific fields
    qb = qb
      .select([
        'employee.id',
        'employee.firstName',
        'employee.lastName',
        'employee.gender',
        'employee.isOnline',
        'employee.averageRating',
        'employee.totalRaters',
        'branch.id',
        'branch.name_en',
        'branch.name_ar',
        'branch.address_en',
        'branch.address_ar',
        'branch.latitude',
        'branch.longitude',
        'provider.id',
        'provider.name_en',
        'provider.name_ar',
        'city.id',
        'city.name_en',
        'city.name_ar',
      ])
      .addSelect(
        `ST_Distance(
          branch.location,
          ST_SetSRID(ST_MakePoint(:lng, :lat), 4326)::geography
        ) / 1000`,
        'distance',
      )
      .orderBy('distance', 'ASC');

    // Get pagination params
    const currentPage = page || 1;
    const itemsPerPage = Math.min(limit || 20, 100);
    const skip = (currentPage - 1) * itemsPerPage;

    // Get total count
    const total = await qb.getCount();

    // Apply pagination and execute
    qb = qb.skip(skip).take(itemsPerPage);
    const result = await qb.getRawAndEntities();

    // Map to clean response structure
    const data = result.entities.map((employee, index) => ({
      ...employee,
      distance: parseFloat(result.raw[index]?.distance || '0'),
    }));

    // Return with nestjs-paginate compatible format
    return {
      data,
      meta: {
        itemsPerPage,
        totalItems: total,
        currentPage,
        totalPages: Math.ceil(total / itemsPerPage),
      },
    };
  }

  /**
   * Rate a doctor (one rating per user)
   */
  async rateDoctor(
    doctorId: string,
    userId: string,
    ratingValue: number,
    notes?: string,
  ): Promise<Employee> {
    // Verify doctor exists and is actually a doctor
    const doctor = await this.repository.findOne({
      where: {
        id: doctorId,
        type: EmployeeType.PROVIDER,
        disabled: false,
        locked: false,
      },
      select: ['id', 'averageRating', 'totalRaters', 'roles'],
    });

    if (!doctor) {
      throw new NotFoundException('Doctor not found');
    }

    // Verify employee has doctor role
    if (!doctor.roles?.includes(Role.PROVIDER_DOCTOR as any)) {
      throw new BadRequestException('Employee is not a doctor');
    }

    const doctorRatingRepo = this.dataSource.getRepository(DoctorRating);

    // Check if user already rated this doctor
    const existingRating = await doctorRatingRepo.findOne({
      where: {
        user: { id: userId },
        employee: { id: doctorId },
      },
    });

    if (existingRating) {
      throw new BadRequestException({
        message: 'You have already rated this doctor',
        code: ErrorCodes.DUPLICATE_RATING,
      });
    }

    // Create rating record - trigger will automatically update doctor's average
    await this.dataSource.transaction(async (manager) => {
      const rating = manager.create(DoctorRating, {
        user: { id: userId } as User,
        employee: { id: doctorId } as Employee,
        rating: ratingValue,
        notes: notes,
      });
      await manager.save(rating);
    });

    return;
  }

  /**
   * Update employee profile photo
   */
  async updateEmployeePhoto(file: Express.Multer.File, employeeId: string) {
    try {
      const fileName = `employee-${employeeId}`;
      const extension = path.extname(file.originalname).toLowerCase();
      const filePath = `${fileName}${extension}`;
      const obj = await this.storageService.saveFile(
        file,
        filePath,
        'employees',
      );

      const updatedEmployee = await this.repository.manager.transaction(
        async (manager) => {
          const employee = await manager.findOneOrFail(Employee, {
            where: { id: employeeId },
          });
          employee.imageUrl = obj.url;
          const savedEmployee = await manager.save(employee);
          delete savedEmployee.password;
          return savedEmployee;
        },
      );

      return { imageUrl: updatedEmployee.imageUrl };
    } catch (error) {
      console.error(error);
      throw error;
    }
  }
}
