import { IsDateString, Matches, IsOptional, IsInt } from 'class-validator';

export class CheckOverlapDto {
  @IsDateString({}, { message: 'Ngày không hợp lệ (định dạng: YYYY-MM-DD)' })
  date: string;

  @Matches(/^([01]\d|2[0-3]):([0-5]\d)$/, {
    message: 'Giờ bắt đầu không hợp lệ (định dạng: HH:mm)',
  })
  startTime: string;

  @Matches(/^([01]\d|2[0-3]):([0-5]\d)$/, {
    message: 'Giờ kết thúc không hợp lệ (định dạng: HH:mm)',
  })
  endTime: string;

  @IsOptional()
  @IsInt({ message: 'excludeJobId phải là số nguyên' })
  excludeJobId?: number;
}
