import { Injectable } from '@nestjs/common';
import { CreateCustomerDto } from './dto/create-customer.dto';
import { UpdateCustomerDto } from './dto/update-customer.dto';
import { DBService } from '@/database/db.service';
import { Customer } from '@/database/entities/customer.entity';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { QueryConfig } from '@/common/query-options';
import { FilterOperator } from 'nestjs-paginate';

export const CUSTOMER_PAGINATION_CONFIG: QueryConfig<Customer> = {
  sortableColumns: ['name', 'contactName', 'contactEmail'],
  filterableColumns: {
    name: [FilterOperator.EQ],
    contactName: [FilterOperator.EQ],
    contactEmail: [FilterOperator.EQ],
    disabled: [FilterOperator.EQ],
  },
  searchableColumns: ['name', 'contactName', 'contactEmail'],
  defaultSortBy: [['metadata.createdAt', 'DESC']],
};

@Injectable()
export class CustomersService extends DBService<
  Customer,
  CreateCustomerDto,
  UpdateCustomerDto
> {
  constructor(
    @InjectRepository(Customer)
    private customerRepository: Repository<Customer>,
  ) {
    super(customerRepository, CUSTOMER_PAGINATION_CONFIG);
  }
}
