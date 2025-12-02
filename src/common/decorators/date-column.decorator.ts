import { Column, ColumnOptions } from 'typeorm';

export function DateColumn(options?: ColumnOptions) {
  return Column({ type: 'timestamp with time zone', ...options });
}
