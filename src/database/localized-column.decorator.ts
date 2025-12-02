import { Column } from 'typeorm';
import {
  EmbededLocalizedColumn,
  EmbededLocalizedName,
  NullableEmbededLocalizedColumn,
  NullableEmbededLocalizedName,
} from './entities/embeded/localized-name.entity';

export function LocalizedColumn() {
  return Column(() => EmbededLocalizedColumn, { prefix: true });
}
export function NullableLocalizedColumn() {
  return Column(() => NullableEmbededLocalizedColumn, { prefix: true });
}

export function LocalizedNameColumn() {
  return Column(() => EmbededLocalizedName, { prefix: false });
}
export function NullableLocalizedNameColumn() {
  return Column(() => NullableEmbededLocalizedName, { prefix: false });
}
