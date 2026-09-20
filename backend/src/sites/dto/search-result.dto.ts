import { PersonDto } from '../../people/dto/person.dto.js';

export class SearchResultDto {
  id!: string;
  address!: string;
  title!: string;
  author!: PersonDto;
}
