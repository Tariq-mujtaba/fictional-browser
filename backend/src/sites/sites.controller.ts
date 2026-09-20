import { Body, Controller, Post } from '@nestjs/common';
import { PublishSiteRequestDto } from './dto/publish-site-request.dto.js';
import { SiteDto } from './dto/site.dto.js';
import { SitesService } from './sites.service.js';

@Controller('sites')
export class SitesController {
  constructor(private readonly sitesService: SitesService) {}

  @Post()
  publish(@Body() request: PublishSiteRequestDto): Promise<SiteDto> {
    return this.sitesService.publish(request);
  }
}
