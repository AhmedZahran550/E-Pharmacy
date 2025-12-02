// src/localization/localization.service.ts
import { Injectable } from '@nestjs/common';
import { I18nService, TranslateOptions } from 'nestjs-i18n';
// import { I18nTranslations } from '../../dist/src/i18n/i18n.generated'

@Injectable()
export class LocalizationService {
  constructor(private readonly i18n: I18nService) {}

  translate(key: string, options?: TranslateOptions): string {
    return this.i18n.translate(key, options);
  }

  /**
   * Shorthand for translate method.
   * @param key The translation key.
   * @param args Optional interpolation variables.
   * @returns The translated string.
   */
  t(key: string, options?: TranslateOptions): string {
    return this.translate(key, options);
  }
}
