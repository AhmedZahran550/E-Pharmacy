import { registerAs } from '@nestjs/config';
import { TypeOrmModuleOptions } from '@nestjs/typeorm';
import { CustomNamingStrategy } from '@/database/custom-naming.strategy';

export default registerAs('database', (): TypeOrmModuleOptions => {
  const dbConfig: TypeOrmModuleOptions = {
    type: 'postgres',
    host: process.env.DB_HOST,
    port: parseInt(process.env.DB_PORT) || 5432,
    username: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    synchronize: process.env.DB_SYNC === 'true',
    logging: process.env.DB_LOGGING === 'true',
    entities: [`${__dirname}/../database/entities/*.entity{.ts,.js}`],
    namingStrategy: new CustomNamingStrategy(),

    // --- ADD THIS SECTION ---
    // Most cloud providers require "rejectUnauthorized: false" to allow self-signed certs
    ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : false,
    // ------------------------
  };
  return dbConfig;
});
