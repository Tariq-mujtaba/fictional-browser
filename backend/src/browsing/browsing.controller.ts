import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { PersonIdParamDto } from '../people/dto/person-id-param.dto.js';
import { BrowsingService } from './browsing.service.js';
import { BrowseRequestDto } from './dto/browse-request.dto.js';
import type { BrowseResultDto } from './dto/browse-result.dto.js';
import { VisitDto } from './dto/visit.dto.js';

@Controller()
export class BrowsingController {
  constructor(private readonly browsingService: BrowsingService) {}

  @Post('browse')
  browse(@Body() request: BrowseRequestDto): Promise<BrowseResultDto> {
    return this.browsingService.browse(request);
  }

  @Get('people/:personId/history')
  history(@Param() params: PersonIdParamDto): Promise<VisitDto[]> {
    return this.browsingService.getHistory(params.personId);
  }
}
