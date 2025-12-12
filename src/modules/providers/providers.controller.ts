import { Controller, Get, Param } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { ProvidersService } from './providers.service';
import { ApiQuery } from '@/common/decorators/pagination-query.decorator';
import { CreateProviderDto } from './dto/create-provider.dto';
import { Paginate } from 'nestjs-paginate';
import { QueryOptions } from '@/common/query-options';
import { Cacheable } from '@/common/decorators/cache.decorator';
import { Roles } from '../auth/decorators/roles.decorator';
import { Role } from '../auth/role.model';

@ApiTags('Providers')
@Controller('providers')
@Roles(Role.APP_USER, Role.GUEST, Role.ANONYMOUS)
export class ProvidersController {
  constructor(private readonly providersService: ProvidersService) {}

  @ApiQuery(CreateProviderDto)
  @Get()
  // Cache TTL: 86400 seconds (24 hours)
  @Cacheable({ key: 'providers:all', ttl: 86400 })
  findAll(@Paginate() query: QueryOptions) {
    return this.providersService.findAll(query);
  }

  @Get(':id')
  // Cache TTL: 3600 seconds (1 hour)
  @Cacheable({ key: 'provider:{{id}}', ttl: 3600 })
  findOne(@Param('id') id: string) {
    return this.providersService.findById(id);
  }
}
