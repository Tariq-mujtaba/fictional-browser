import { SiteDto } from '../../sites/dto/site.dto.js';

export class FoundBrowseResultDto {
  outcome!: 'found';
  address!: string;
  site!: SiteDto;
}

export class NotFoundBrowseResultDto {
  outcome!: 'not_found';
  address!: string;
}

export type BrowseResultDto = FoundBrowseResultDto | NotFoundBrowseResultDto;
