import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { PeopleModule } from '../people/people.module.js';
import { SitesModule } from '../sites/sites.module.js';
import { BrowsingController } from './browsing.controller.js';
import { BrowsingService } from './browsing.service.js';
import { Visit, VisitSchema } from './schemas/visit.schema.js';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Visit.name, schema: VisitSchema }]),
    PeopleModule,
    SitesModule,
  ],
  controllers: [BrowsingController],
  providers: [BrowsingService],
  exports: [MongooseModule],
})
export class BrowsingModule {}
