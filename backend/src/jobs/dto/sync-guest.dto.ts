import { Type } from 'class-transformer';
import { ValidateNested, IsArray } from 'class-validator';
import { CreateJobDto } from './create-job.dto.js';

export class SyncGuestDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateJobDto)
  jobs: CreateJobDto[];
}
