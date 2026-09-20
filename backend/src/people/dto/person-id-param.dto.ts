import { IsMongoId } from 'class-validator';

export class PersonIdParamDto {
  @IsMongoId()
  personId!: string;
}
