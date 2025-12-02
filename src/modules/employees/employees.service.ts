import { DBService } from '@/database/db.service';
import { Employee } from '@/database/entities/employee.entity';
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreateEmployeeDto } from './dto/create-employee.dto';
import { EmployeeDto } from './dto/employee.dto';
import { UpdateEmployeeDto } from './dto/update-employee.dto';
import { QueryOptions } from '@/common/query-options';

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
  ) {
    super(repository);
  }

  async create(data: CreateEmployeeDto) {
    const employee = await super.create(data);
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
    // Include the customer relationship to fetch customerId
    qb.leftJoinAndSelect('employee.customer', 'customer');
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
  async findCustomerEmployees(customerId: string, option?: QueryOptions) {
    const qb = this.repository.createQueryBuilder('employee');
    qb.leftJoin('employee.customer', 'customer');
    qb.where('customer.id = :customerId', { customerId }).andWhere(
      'employee.type = "customer"',
    );
    return await super.findAll(option, qb);
  }

  mapper(entity: Employee) {
    return entity as any as EmployeeDto;
  }
}
