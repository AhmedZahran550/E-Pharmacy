import { DefaultNamingStrategy, NamingStrategyInterface } from 'typeorm';
import { snakeCase } from 'typeorm/util/StringUtils';

export class CustomNamingStrategy
  extends DefaultNamingStrategy
  implements NamingStrategyInterface
{
  columnName(
    propertyName: string,
    customName?: string,
    embeddedPrefixes: string[] = [],
  ): string {
    return snakeCase(
      [...embeddedPrefixes, customName || propertyName].join('_'),
    );
  }

  foreignKeyName(
    tableOrName: string | { name: string },
    columnNames: string[],
    referencedTablePath?: string,
    referencedColumnNames?: string[],
  ): string {
    const tableName = snakeCase(typeof tableOrName === 'string' ? tableOrName : tableOrName.name);
    const formattedColumns = columnNames.map(snakeCase).join('_');

    if (referencedTablePath && referencedColumnNames) {
      const referencedTableName =
        referencedTablePath.split('.').pop() || referencedTablePath;
      return `FK_${tableName}_${formattedColumns}_to_${snakeCase(referencedTableName)}`;
    }

    return `FK_${tableName}_${formattedColumns}`;
  }

  indexName(
    tableOrName: string | { name: string },
    columnNames: string[],
    where?: string,
  ): string {
    const tableName = snakeCase(typeof tableOrName === 'string' ? tableOrName : tableOrName.name);
    const formattedColumns = columnNames.map(snakeCase).join('_');
    return `IDX_${tableName}_${formattedColumns}${where ? '_where' : ''}`;
  }

  primaryKeyName(
    tableOrName: string | { name: string },
    columnNames: string[],
  ): string {
    const tableName = snakeCase(typeof tableOrName === 'string' ? tableOrName : tableOrName.name);
    const formattedColumns = columnNames.map(snakeCase).join('_');
    return `PK_${tableName}_${formattedColumns}`;
  }
}