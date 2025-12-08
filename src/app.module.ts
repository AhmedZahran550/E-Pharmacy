import { GeneralExceptionFilter } from '@/common/filters/general-exception.filter';
import { LoggingInterceptor } from '@/common/interceptors/log.interceptor';
import { LoggerMiddleware } from '@/common/logger.middleware';
import { SharedModule } from '@/common/shared.module';
import { DatabaseModule } from '@/database/database.module';
import { LocalizationModule } from '@/i18n/localization.module';
import {
  ClassSerializerInterceptor,
  MiddlewareConsumer,
  Module,
  NestModule,
  RequestMethod,
} from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { APP_FILTER, APP_INTERCEPTOR } from '@nestjs/core';
import {
  AcceptLanguageResolver,
  CookieResolver,
  HeaderResolver,
  I18nModule,
  QueryResolver,
} from 'nestjs-i18n';
import * as path from 'path';
import { baseConfig } from './config/base.config';
import databaseConfig from './config/database.config';
import { AuthModule } from './modules/auth/auth.module';
import { BranchesModule } from './modules/branches/branches.module';
import { EmployeesModule } from './modules/employees/employees.module';
import { UsersModule } from './modules/users/users.module';
import { schemaValidator } from './config/schema-validator';
import { OrdersModule } from './modules/orders/orders.module';
import { PostAuthorizeInterceptor } from '@/common/interceptors/post-authorize.interceptor';
import { MetadataInterceptor } from '@/common/interceptors/metadata.interceptor';
import { CacheModule } from '@nestjs/cache-manager';
import { cacheConfigFactory } from './common/cacheManager.config';
import { EmailModule } from './common/mailer/email.module';
import { CacheInterceptor } from './common/interceptors/cache.interceptor';
import { DBExceptionFilter } from './common/filters/db-exception.filter';
import { AppController } from './app.controller';
import { LogsModule } from './modules/logs/logs.module';
import { NotificationsModule } from './modules/notifications/notifications.module';
const envFolderPath = `${__dirname}/config/env`;

const envFilePath = [
  `${envFolderPath}/${process.env.NODE_ENV ?? 'development'}.env`,
  `${envFolderPath}/default.env`, // If a variable is found in multiple files, the first one takes precedence.
];
@Module({
  controllers: [AppController],
  imports: [
    ConfigModule.forRoot({
      validate: schemaValidator,
      envFilePath,
      isGlobal: true,
      cache: true,
      expandVariables: true,
      load: [baseConfig, databaseConfig],
      ignoreEnvFile: process.env.NODE_ENV === 'production',
    }),
    I18nModule.forRootAsync({
      useFactory: (configService: ConfigService) => ({
        fallbackLanguage: configService.getOrThrow('FALLBACK_LANGUAGE'),
        loaderOptions: {
          path: path.join(__dirname, '/i18n/'),
          watch: true,
        },
        typesOutputPath: path.join(__dirname, '/i18n/i18n.generated.ts'),
      }),
      resolvers: [
        new QueryResolver(['lang', 'l']),
        new HeaderResolver(['x-lang']),
        new CookieResolver(),
        AcceptLanguageResolver,
      ],
      inject: [ConfigService],
    }),
    ...(() => {
      const configService = new ConfigService(); // Create a new instance of ConfigService to access the environment variables
      const isCacheEnabled =
        configService.get<string>('CACHE_ENABLED')?.toLowerCase() === 'true' ||
        false;
      if (isCacheEnabled) {
        console.log('Caching is ENABLED.');
        return [
          CacheModule.registerAsync({
            imports: [ConfigModule],
            useFactory: cacheConfigFactory,
            inject: [ConfigService],
            isGlobal: true,
          }),
        ];
      } else {
        console.log('Caching is DISABLED.');
        return [];
      }
    })(),
    DatabaseModule,
    AuthModule,
    LogsModule,
    UsersModule,
    BranchesModule,
    SharedModule,
    EmployeesModule,
    LocalizationModule,
    OrdersModule,
    EmailModule,
    NotificationsModule,
    LogsModule,
  ],
  providers: [
    {
      provide: APP_INTERCEPTOR,
      useClass: LoggingInterceptor,
    },
    {
      provide: APP_FILTER,
      useClass: GeneralExceptionFilter,
    },
    {
      provide: APP_FILTER,
      useClass: DBExceptionFilter,
    },
    {
      provide: APP_INTERCEPTOR,
      useClass: ClassSerializerInterceptor,
    },
    {
      provide: APP_INTERCEPTOR,
      useClass: PostAuthorizeInterceptor,
    },
    {
      provide: APP_INTERCEPTOR,
      useClass: MetadataInterceptor,
    },
    {
      provide: APP_INTERCEPTOR,
      useClass: CacheInterceptor,
    },
  ],
})
export class AppModule implements NestModule {
  constructor(private configService: ConfigService) {}
  configure(consumer: MiddlewareConsumer) {
    // if (this.configService.get<string>('NODE_ENV') === 'production')
    if (true) {
      consumer
        .apply(LoggerMiddleware)
        .exclude(
          {
            path: 'api/logs',
            method: RequestMethod.POST,
          },
          {
            path: 'api/logs',
            method: RequestMethod.GET,
          },
          {
            path: 'api/logs',
            method: RequestMethod.DELETE,
          },
        )
        .forRoutes('*');
    }
  }
}
// export class AppModule {}
