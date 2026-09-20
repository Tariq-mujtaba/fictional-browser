import { Transform } from 'class-transformer';
import {
  IsMongoId,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
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
  @MaxLength(200)
  title?: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(100_000)
  html!: string;
}
