import { Module } from '@nestjs/common';
import { ItemsController } from './items.controller';
import { ItemsService } from './items.service';
import { BranchesModule } from '../branches/branches.module';
import { BranchItemsController } from './branch-items.controller';
import { UploadItemsService } from './upload-items.service';
import { SectionItemsController } from './section-items.controller';
import { AdminItemsController } from './admin-items.controller';
import { ProviderBranchItemsController } from './provider-items.controller';
import { AdminProviderItemsController } from './admin-provider-items.controller';
import { AdminOfferItemsController } from './admin-offer-items.controller';

@Module({
  controllers: [
    ItemsController,
    BranchItemsController,
    SectionItemsController,
    AdminItemsController,
    ProviderBranchItemsController,
    AdminProviderItemsController,
    AdminOfferItemsController,
  ],
  providers: [ItemsService, UploadItemsService],
  imports: [BranchesModule],
  exports: [ItemsService],
})
export class ItemsModule {}
