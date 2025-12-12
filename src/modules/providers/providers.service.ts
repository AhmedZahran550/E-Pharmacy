import { localizedQueryConfig } from '@/common/models/localized.name';
import { QueryConfig } from '@/common/query-options';
import { DBService } from '@/database/db.service';
import { Provider } from '@/database/entities/provider.entity';
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { CacheService } from '@/common/cache.service';

export const PROVIDERS_PAGINATION_CONFIG: QueryConfig<Provider> = {
  sortableColumns: [...localizedQueryConfig.sortableColumns],
  filterableColumns: {
    ...localizedQueryConfig.filterableColumns,
    isActive: ['EQ'],
  },
  searchableColumns: ['localizedName.en', 'localizedName.ar'],
  relations: ['branches'],
};

@Injectable()
export class ProvidersService extends DBService<Provider> {
  constructor(
    @InjectRepository(Provider)
    repository: Repository<Provider>,
    private cacheService: CacheService,
    private dataSource: DataSource,
  ) {
    super(repository, PROVIDERS_PAGINATION_CONFIG);
  }
}
