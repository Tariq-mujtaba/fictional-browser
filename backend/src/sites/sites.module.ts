import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { PeopleModule } from '../people/people.module.js';
import { Site, SiteSchema } from './schemas/site.schema.js';
import { SearchController } from './search.controller.js';
import { SiteContentService } from './site-content.service.js';
import { SitesController } from './sites.controller.js';
import { SitesService } from './sites.service.js';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Site.name, schema: SiteSchema }]),
    PeopleModule,
  ],
  controllers: [SitesController, SearchController],
  providers: [SitesService, SiteContentService],
  exports: [MongooseModule, SitesService],
})
export class SitesModule {}
