import {
  BadRequestException,
  ConflictException,
  Injectable,
  InternalServerErrorException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import type { Model, Types } from 'mongoose';
import { PersonDto } from '../people/dto/person.dto.js';
import { PeopleService } from '../people/people.service.js';
import { PublishSiteRequestDto } from './dto/publish-site-request.dto.js';
import { SearchResultDto } from './dto/search-result.dto.js';
import { SiteDto } from './dto/site.dto.js';
import { Site } from './schemas/site.schema.js';
import { SiteContentService } from './site-content.service.js';

interface SiteRecord {
  _id: Types.ObjectId;
  address: string;
  title: string;
  html: string;
  authorId: Types.ObjectId;
  publishedAt: Date;
}

interface SearchSiteRecord {
  _id: Types.ObjectId;
  address: string;
  title: string;
  authorId: Types.ObjectId;
  score: number;
}

@Injectable()
export class SitesService {
  constructor(
    @InjectModel(Site.name) private readonly siteModel: Model<Site>,
    private readonly peopleService: PeopleService,
    private readonly siteContentService: SiteContentService,
  ) {}

  async findByAddress(address: string): Promise<SiteDto | null> {
    const site = await this.siteModel
      .findOne(
        { address },
        { address: 1, title: 1, html: 1, authorId: 1, publishedAt: 1 },
      )
      .lean<SiteRecord>()
      .exec();

    if (site === null) {
      return null;
    }

    const author = await this.peopleService.findByIdOrThrow(
      site.authorId.toHexString(),
    );

    return toSiteDto(site, author);
  }

  async publish(request: PublishSiteRequestDto): Promise<SiteDto> {
    const author = await this.peopleService.findByIdOrThrow(request.authorId);
    const content = this.siteContentService.prepare(request.html);
    const submittedTitle = this.siteContentService.toPlainText(
      request.title ?? '',
    );
    const title = submittedTitle === '' ? request.address : submittedTitle;

    try {
      const site = await this.siteModel.create({
        address: request.address,
        title,
        html: content.html,
        searchText: content.searchText,
        authorId: request.authorId,
      });

      return {
        id: site._id.toHexString(),
        address: site.address,
        title: site.title,
        html: site.html,
        author,
        publishedAt: site.publishedAt.toISOString(),
      };
    } catch (error: unknown) {
      if (isDuplicateKeyError(error)) {
        throw new ConflictException('Address is already published');
      }

      throw error;
    }
  }

  async search(query: string): Promise<SearchResultDto[]> {
    let sites: SearchSiteRecord[];

    try {
      sites = await this.siteModel
        .aggregate<SearchSiteRecord>([
          { $match: { $text: { $search: query } } },
          {
            $project: {
              address: 1,
              title: 1,
              authorId: 1,
              score: { $meta: 'textScore' },
            },
          },
          { $sort: { score: -1, address: 1 } },
        ])
        .exec();
    } catch (error: unknown) {
      if (isInvalidTextQueryError(error)) {
        throw new BadRequestException('q must be a valid text search');
      }

      throw error;
    }

    const authors = await this.peopleService.findByIds(
      sites.map(({ authorId }) => authorId),
    );

    return sites.map((site) => {
      const author = authors.get(site.authorId.toHexString());

      if (author === undefined) {
        throw new InternalServerErrorException('Site author not found');
      }

      return {
        id: site._id.toHexString(),
        address: site.address,
        title: site.title,
        author,
      };
    });
  }
}

function toSiteDto(site: SiteRecord, author: PersonDto): SiteDto {
  return {
    id: site._id.toHexString(),
    address: site.address,
    title: site.title,
    html: site.html,
    author,
    publishedAt: site.publishedAt.toISOString(),
  };
}

function isDuplicateKeyError(error: unknown): error is { code: 11000 } {
  return hasErrorCode(error, 11_000);
}

function isInvalidTextQueryError(error: unknown): boolean {
  return hasErrorCode(error, 2) || hasErrorCode(error, 17_244);
}

function hasErrorCode(error: unknown, code: number): boolean {
  return (
    typeof error === 'object' &&
    error !== null &&
    'code' in error &&
    error.code === code
  );
}
