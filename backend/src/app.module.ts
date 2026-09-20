import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { AppController } from './app.controller.js';
import { AppService } from './app.service.js';
import { BrowsingModule } from './browsing/browsing.module.js';
import { PeopleModule } from './people/people.module.js';
import { SitesModule } from './sites/sites.module.js';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    MongooseModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        uri:
          config.get<string>('MONGODB_URI') ??
          'mongodb://localhost:27017/fictional_web',
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
