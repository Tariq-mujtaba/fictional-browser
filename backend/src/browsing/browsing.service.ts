import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import type { Model, Types } from 'mongoose';
import { PeopleService } from '../people/people.service.js';
import { SitesService } from '../sites/sites.service.js';
import { BrowseRequestDto } from './dto/browse-request.dto.js';
import type { BrowseResultDto } from './dto/browse-result.dto.js';
import { VisitDto } from './dto/visit.dto.js';
import { Visit } from './schemas/visit.schema.js';

interface VisitRecord {
  _id: Types.ObjectId;
  address: string;
  method: Visit['method'];
  outcome: Visit['outcome'];
  siteId: Types.ObjectId | null;
  visitedAt: Date;
}

@Injectable()
export class BrowsingService {
  constructor(
    @InjectModel(Visit.name) private readonly visitModel: Model<Visit>,
    private readonly peopleService: PeopleService,
    private readonly sitesService: SitesService,
  ) {}

  async browse(request: BrowseRequestDto): Promise<BrowseResultDto> {
    await this.peopleService.findByIdOrThrow(request.personId);
    const site = await this.sitesService.findByAddress(request.address);

    await this.visitModel.create({
      personId: request.personId,
      address: request.address,
      siteId: site?.id ?? null,
      method: request.method,
      outcome: site === null ? 'not_found' : 'found',
    });

    if (site === null) {
      return {
        outcome: 'not_found',
        address: request.address,
      };
    }

    return {
      outcome: 'found',
      address: request.address,
      site,
    };
  }

  async getHistory(personId: string): Promise<VisitDto[]> {
    await this.peopleService.findByIdOrThrow(personId);

    const visits = await this.visitModel
      .find(
        { personId },
        { address: 1, method: 1, outcome: 1, siteId: 1, visitedAt: 1 },
      )
      .sort({ visitedAt: -1, _id: -1 })
      .lean<VisitRecord[]>()
      .exec();

    return visits.map((visit) => ({
      id: visit._id.toHexString(),
      address: visit.address,
      method: visit.method,
      outcome: visit.outcome,
      siteId: visit.siteId?.toHexString() ?? null,
      visitedAt: visit.visitedAt.toISOString(),
    }));
  }
}
