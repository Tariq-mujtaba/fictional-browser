import { Transform } from 'class-transformer';
import { IsEnum, IsMongoId, IsString, Matches } from 'class-validator';
import {
  FICTIONAL_ADDRESS_PATTERN,
  normalizeFictionalAddress,
} from '../../common/fictional-address.js';
import { ArrivalMethod } from '../arrival-method.js';

export class BrowseRequestDto {
  @IsMongoId()
  personId!: string;

  @Transform(({ value }) =>
    typeof value === 'string' ? normalizeFictionalAddress(value) : value,
  )
  @IsString()
  @Matches(FICTIONAL_ADDRESS_PATTERN)
  address!: string;

  @IsEnum(ArrivalMethod)
  method!: ArrivalMethod;
}
