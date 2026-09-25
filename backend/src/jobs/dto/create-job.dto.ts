import { IsString, IsNotEmpty, IsOptional, IsDateString, Matches, IsNumber, Min, IsBoolean } from 'class-validator';

export class CreateJobDto {
  @IsString()
  @IsNotEmpty({ message: 'Tên công việc không được để trống' })
  title: string;

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
  @IsString()
  note?: string;

  @IsOptional()
  @IsNumber({}, { message: 'Tiền công phải là số' })
  @Min(0, { message: 'Tiền công không được âm' })
  cost?: number;

  @IsOptional()
  @IsBoolean({ message: 'Trạng thái trả tiền phải là true/false' })
  paid?: boolean;
}
