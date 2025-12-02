import { Column, ColumnOptions } from 'typeorm';

export function DecimalColumn(options?: Omit<ColumnOptions, 'type'>) {
  return Column({
    type: 'decimal',
    precision: options?.precision ?? 10,
    scale: options?.precision ?? 2,
    transformer: {
      to: (value: number) => value, // Store as is
      from: (value: string) => (value !== null ? parseFloat(value) : null), // Convert to number
    },
    ...options,
  });
}
