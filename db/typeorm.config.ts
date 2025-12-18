import { config } from 'dotenv';
import { DataSource, DataSourceOptions } from 'typeorm';
import { CustomNamingStrategy } from '../src/database/custom-naming.strategy';

import * as path from 'path';

config({
  path: path.resolve(__dirname, '../src/config/env/development.env'),
});

export default new DataSource({
  type: 'postgres',
  host: process.env.DB_HOST,
  port: parseInt(process.env.DB_PORT) || 5432,
  username: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  synchronize: process.env.DB_SYNC === 'true',
  logging: process.env.DB_LOGGING === 'true',
  entities: [__dirname + '/../src/database/entities/*.entity{.ts,.js}'],
  namingStrategy: new CustomNamingStrategy(),
  migrations: [__dirname + '/migrations/*{.ts,.js}'],
  ssl: process.env.DB_SSL === 'true',
} as DataSourceOptions);
