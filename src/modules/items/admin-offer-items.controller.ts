import { ApiQuery } from '@/common/decorators/pagination-query.decorator';
import { UuidParam } from '@/common/decorators/uuid-param.decorator';
import { QueryOptions } from '@/common/query-options';
import { Controller, Get, Query } from '@nestjs/common';
import { Paginate } from 'nestjs-paginate';
import { Roles } from '../auth/decorators/roles.decorator';
import { Role } from '../auth/role.model';
import { CreateServiceDto } from './dto/create-item.dto';
import { ItemsService } from './items.service';
import { UploadItemsService } from './upload-items.service';
import { Subject } from '../auth/policies.types';
import { Policies } from '../auth/decorators/policies.decorator';

@Roles(Role.SYSTEM_USER)
@Policies({ subject: Subject.items })
@Controller('admin/offers/:offerId/items')
export class AdminOfferItemsController {
  constructor(private readonly itemsService: ItemsService) {}

  @Get()
  @ApiQuery(CreateServiceDto)
  findAll(
    @Paginate() query: QueryOptions,
    @UuidParam('offerId') offerId: string,
  ) {
    return this.itemsService.findOfferItems(offerId, query);
  }

  @Get(':id')
  findOne(@UuidParam() id: string, @UuidParam('offerId') offerId: string) {
    return this.itemsService.findOne({
      where: {
        id,
        offerItems: {
          offer: {
            id: offerId,
          },
        },
      },
    });
  }
}
