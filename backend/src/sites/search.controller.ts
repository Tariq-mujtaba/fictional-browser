import { Controller, Get, Query } from '@nestjs/common';
import { SearchQueryDto } from './dto/search-query.dto.js';
import { SearchResultDto } from './dto/search-result.dto.js';
import { SitesService } from './sites.service.js';

@Controller('search')
export class SearchController {
  constructor(private readonly sitesService: SitesService) {}

  @Get()
  search(@Query() query: SearchQueryDto): Promise<SearchResultDto[]> {
    return this.sitesService.search(query.q);
  }
}
