import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import type { Model, Types } from 'mongoose';
import { PersonDto } from './dto/person.dto.js';
import { Person } from './schemas/person.schema.js';

interface PersonRecord {
  _id: Types.ObjectId;
  name: string;
}

@Injectable()
export class PeopleService {
  constructor(
    @InjectModel(Person.name) private readonly personModel: Model<Person>,
  ) {}

  async findAll(): Promise<PersonDto[]> {
    const people = await this.personModel
      .find({}, { name: 1 })
      .sort({ name: 1, _id: 1 })
      .lean<PersonRecord[]>()
      .exec();

    return people.map(toPersonDto);
  }

  async findByIdOrThrow(personId: string): Promise<PersonDto> {
    const person = await this.personModel
      .findById(personId, { name: 1 })
      .lean<PersonRecord>()
      .exec();

    if (person === null) {
      throw new NotFoundException('Person not found');
    }

    return toPersonDto(person);
  }

  async findByIds(
    personIds: Types.ObjectId[],
  ): Promise<Map<string, PersonDto>> {
    const people = await this.personModel
      .find({ _id: { $in: personIds } }, { name: 1 })
      .lean<PersonRecord[]>()
      .exec();

    return new Map(
      people.map((person) => [person._id.toHexString(), toPersonDto(person)]),
    );
  }
}

function toPersonDto(person: PersonRecord): PersonDto {
  return {
    id: person._id.toHexString(),
    name: person.name,
  };
}
