import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { SchemaTypes } from 'mongoose';
import type { HydratedDocument, Types } from 'mongoose';
import {
  isValidFictionalAddress,
  normalizeFictionalAddress,
} from '../../common/fictional-address.js';
import { Person } from '../../people/schemas/person.schema.js';

export type SiteDocument = HydratedDocument<Site>;

@Schema({ collection: 'sites', versionKey: false })
export class Site {
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

  @Prop({ required: true, trim: true, type: String })
  title!: string;

  @Prop({ required: true, type: String })
  html!: string;

  @Prop({ required: true, type: String })
  searchText!: string;

  @Prop({ ref: Person.name, required: true, type: SchemaTypes.ObjectId })
  authorId!: Types.ObjectId;

  @Prop({ default: Date.now, required: true, type: Date })
  publishedAt!: Date;
}

export const SiteSchema = SchemaFactory.createForClass(Site);

SiteSchema.index({ address: 1 }, { unique: true });
SiteSchema.index({ title: 'text', searchText: 'text' });
