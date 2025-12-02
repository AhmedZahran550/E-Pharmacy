import { Controller, Get } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { I18n, I18nContext } from 'nestjs-i18n';
import { Public } from './modules/auth/decorators/public.decorator';
@ApiTags('App')
@Controller()
export class AppController {
  @Get('health')
  @Public()
  async healthCheck(@I18n() i18n: I18nContext) {
    return await i18n.t('default.health');
  }
}
