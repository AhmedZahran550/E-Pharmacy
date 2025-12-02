import { Type, applyDecorators } from '@nestjs/common';
import { ApiOkPaginatedResponse, ApiPaginationQuery, PaginateConfig } from 'nestjs-paginate';
import { defaultQueryConfig } from '@/database/db.service';

export function ApiQuery(dto: Type<unknown>, paginatedConfig?: PaginateConfig<any>) {
    return applyDecorators(
        ApiOkPaginatedResponse(dto, paginatedConfig), // Add the missing paginatedConfig argument
        ApiPaginationQuery(paginatedConfig ?? defaultQueryConfig),
    );
}