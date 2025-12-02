import { Global, Module } from '@nestjs/common';
import { GlobalSearchService } from './globalSearch.service';
import { GlobalSearchController } from './globalSearch.controller';

@Global()
@Module({
  providers: [GlobalSearchService],
  controllers: [GlobalSearchController],
})
export class GlobalSearchModule {}
