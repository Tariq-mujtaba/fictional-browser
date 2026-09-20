import { ArrivalMethod } from '../arrival-method.js';
import type { BrowseOutcome } from '../browse-outcome.js';

export class VisitDto {
  id!: string;
  address!: string;
  method!: ArrivalMethod;
  outcome!: BrowseOutcome;
  siteId!: string | null;
  visitedAt!: string;
}
