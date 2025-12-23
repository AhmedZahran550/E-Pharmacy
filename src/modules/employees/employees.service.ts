import { DBService } from '@/database/db.service';
import { Employee, EmployeeType } from '@/database/entities/employee.entity';
import { Branch } from '@/database/entities/branch.entity';
import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreateEmployeeDto } from './dto/create-employee.dto';
import { EmployeeDto } from './dto/employee.dto';
import { UpdateEmployeeDto } from './dto/update-employee.dto';
import { QueryOptions } from '@/common/query-options';
import { ErrorCodes } from '@/common/error-codes';
import { Role } from '../auth/role.model';

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
  ) {
    super(repository);
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

    // Increment branch doctorsCount if employee is a doctor
    if (
      data.branch?.id &&
      data.roles?.includes(Role.PROVIDER_DOCTOR) &&
      data.type === EmployeeType.PROVIDER
    ) {
      await this.branchRepository.increment(
        { id: data.branch.id },
        'doctorsCount',
        1,
      );
    }

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
    // First, fetch the employee to check if they're a doctor
    const employee = await this.repository.findOne({
      where: {
        id,
        ...options?.where,
      },
      relations: ['branch'],
    });

    // Call parent delete
    await super.softDelete(id, options);

    // Decrement branch doctorsCount if employee was a doctor
    if (
      employee?.branch?.id &&
      employee.roles?.includes(Role.PROVIDER_DOCTOR) &&
      employee.type === EmployeeType.PROVIDER
    ) {
      await this.branchRepository.decrement(
        { id: employee.branch.id },
        'doctorsCount',
        1,
      );
    }
  }
}
