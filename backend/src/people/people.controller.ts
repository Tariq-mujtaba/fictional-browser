import { Controller, Get } from '@nestjs/common';
import { PersonDto } from './dto/person.dto.js';
import { PeopleService } from './people.service.js';

@Controller('people')
export class PeopleController {
  constructor(private readonly peopleService: PeopleService) {}

  @Get()
  findAll(): Promise<PersonDto[]> {
    return this.peopleService.findAll();
  }
}
