import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseInterceptors,
} from '@nestjs/common';
import { CustomersService } from './customers.service';
import { CreateCustomerDto } from './dto/create-customer.dto';
import { UpdateCustomerDto } from './dto/update-customer.dto';
import { Paginate } from 'nestjs-paginate';
import { QueryOptions } from '@/common/query-options';
import { Policies } from '../auth/decorators/policies.decorator';
import { PolicyAction, Subject } from '../auth/policies.types';
import { Roles } from '../auth/decorators/roles.decorator';
import { Role } from '../auth/role.model';
import { Cacheable, CacheEvict } from '@/common/decorators/cache.decorator';
import { CacheInterceptor } from '@/common/interceptors/cache.interceptor';

@Controller('admin/customers')
@Policies({ subject: Subject.customers })
@Roles(Role.SYSTEM_USER)
export class AdminCustomersController {
  constructor(private readonly customersService: CustomersService) {}

  @Post()
  @CacheEvict('customer:all')
  create(@Body() createCustomerDto: CreateCustomerDto) {
    return this.customersService.create(createCustomerDto);
  }

  @Get()
  @Cacheable({ key: 'customer:all', ttl: 60 })
  findAll(@Paginate() query: QueryOptions) {
    return this.customersService.findAll(query);
  }

  @Get(':id')
  @Cacheable({ key: 'customer:{{id}}', ttl: 2592000 }) // 1 month
  findOne(@Param('id') id: string) {
    return this.customersService.findById(id);
  }

  @Patch(':id')
  @CacheEvict('customer:all', 'customer:{{id}}')
  update(
    @Param('id') id: string,
    @Body() updateCustomerDto: UpdateCustomerDto,
  ) {
    return this.customersService.update(id, updateCustomerDto);
  }
  @CacheEvict('customer:all', 'customer:{{id}}')
  @Delete(':id')
  delete(@Param('id') id: string) {
    return this.customersService.softDelete(id);
  }
}
