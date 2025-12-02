import { Column, ColumnOptions } from 'typeorm';

export function TimeColumn(options?: ColumnOptions) {
  return Column({ type: 'time without time zone', ...options });
}
