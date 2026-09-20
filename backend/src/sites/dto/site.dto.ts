import { PersonDto } from '../../people/dto/person.dto.js';

export class SiteDto {
  id!: string;
  address!: string;
  title!: string;
  html!: string;
  author!: PersonDto;
  publishedAt!: string;
}
