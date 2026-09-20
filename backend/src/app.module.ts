import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { AppController } from './app.controller.js';
import { AppService } from './app.service.js';
import { BrowsingModule } from './browsing/browsing.module.js';
import { validateEnvironment } from './config/environment.js';
import { PeopleModule } from './people/people.module.js';
import { SitesModule } from './sites/sites.module.js';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      validate: validateEnvironment,
    }),
    MongooseModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        uri: config.getOrThrow<string>('MONGODB_URI'),
      }),
    }),
    PeopleModule,
    SitesModule,
    BrowsingModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
