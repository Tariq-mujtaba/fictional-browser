import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { SchemaTypes } from 'mongoose';
import type { HydratedDocument, Types } from 'mongoose';
import {
  isValidFictionalAddress,
  normalizeFictionalAddress,
} from '../../common/fictional-address.js';
import { Person } from '../../people/schemas/person.schema.js';
import { Site } from '../../sites/schemas/site.schema.js';
import { ARRIVAL_METHODS, ArrivalMethod } from '../arrival-method.js';
import { BROWSE_OUTCOMES, type BrowseOutcome } from '../browse-outcome.js';

export type VisitDocument = HydratedDocument<Visit>;

@Schema({ collection: 'visits', versionKey: false })
export class Visit {
  @Prop({ ref: Person.name, required: true, type: SchemaTypes.ObjectId })
  personId!: Types.ObjectId;

  @Prop({
    required: true,
    set: normalizeFictionalAddress,
    type: String,
    validate: {
      message: 'Address must be a valid .zz address',
      validator: isValidFictionalAddress,
    },
  })
  address!: string;

  @Prop({
    default: null,
    ref: Site.name,
    type: SchemaTypes.ObjectId,
  })
  siteId!: Types.ObjectId | null;

  @Prop({ enum: ARRIVAL_METHODS, required: true, type: String })
  method!: ArrivalMethod;

  @Prop({ enum: BROWSE_OUTCOMES, required: true, type: String })
  outcome!: BrowseOutcome;

  @Prop({ default: Date.now, required: true, type: Date })
  visitedAt!: Date;
}

export const VisitSchema = SchemaFactory.createForClass(Visit);

VisitSchema.index({ personId: 1, visitedAt: -1, _id: -1 });
