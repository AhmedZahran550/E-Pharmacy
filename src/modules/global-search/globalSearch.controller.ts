import { Controller, Get, Query } from '@nestjs/common';
import { Roles } from '@/modules/auth/decorators/roles.decorator';
import { Role } from '@/modules/auth/role.model';
import { GlobalSearchDto } from './dto/global-search.dto';
import { Cacheable } from '../../common/decorators/cache.decorator';
import { GlobalSearchService } from './globalSearch.service';
import { AuthUserDto } from '../auth/dto/auth-user.dto';
import { AuthUser } from '../auth/decorators/auth-user.decorator';

@Roles(Role.APP_USER)
@Controller('search')
export class GlobalSearchController {
  constructor(private searchService: GlobalSearchService) {}
  @Get()
  @Cacheable({ key: 'global_search', ttl: 600 }) // 10 minutes
  async globalSearch(
    @Query() query: GlobalSearchDto,
    @AuthUser() user: AuthUserDto,
  ) {
    return await this.searchService.search(query, user);
  }

  @Get('history')
  async getSearchHistory(@AuthUser() user: AuthUserDto) {
    return this.searchService.getUserSearchHistory(user.id);
  }

  @Get('popular')
  async getMostSearchedWords() {
    return this.searchService.getMostSearchedWords();
  }
}
