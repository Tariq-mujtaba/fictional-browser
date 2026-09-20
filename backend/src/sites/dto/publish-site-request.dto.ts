import { Transform } from 'class-transformer';
import {
  IsMongoId,
  IsNotEmpty,
  IsOptional,
  IsString,
  Matches,
} from 'class-validator';
import {
  FICTIONAL_ADDRESS_PATTERN,
  normalizeFictionalAddress,
} from '../../common/fictional-address.js';

export class PublishSiteRequestDto {
  @IsMongoId()
  authorId!: string;

  @Transform(({ value }) =>
    typeof value === 'string' ? normalizeFictionalAddress(value) : value,
  )
  @IsString()
  @Matches(FICTIONAL_ADDRESS_PATTERN)
  address!: string;

  @IsOptional()
  @IsString()
  title?: string;

  @IsString()
  @IsNotEmpty()
  html!: string;
}
