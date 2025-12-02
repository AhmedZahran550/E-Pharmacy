import { LocalizationService } from '@/i18n/localization.service';
import { Global, Module } from '@nestjs/common';

@Global()
@Module({
  providers: [LocalizationService],
  exports: [LocalizationService],
})
export class LocalizationModule {}
