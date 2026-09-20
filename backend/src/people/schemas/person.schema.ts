import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import type { HydratedDocument } from 'mongoose';

export type PersonDocument = HydratedDocument<Person>;

@Schema({ collection: 'people', versionKey: false })
export class Person {
  @Prop({ required: true, trim: true, type: String })
  name!: string;

  @Prop({ default: Date.now, required: true, type: Date })
  createdAt!: Date;
}

export const PersonSchema = SchemaFactory.createForClass(Person);

PersonSchema.index({ name: 1 }, { unique: true });
