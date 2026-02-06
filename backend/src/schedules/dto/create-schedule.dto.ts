import { IsDateString, IsString, Matches } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateScheduleDto {
  @ApiProperty({ example: '2025-02-10', description: '상담 날짜 (YYYY-MM-DD)' })
  @IsDateString()
  date: string;

  @ApiProperty({ example: '09:00', description: '시작 시간 (HH:mm, 30분 단위)' })
  @IsString()
  @Matches(/^([01]\d|2[0-3]):(00|30)$/, {
    message: '시간은 HH:00 또는 HH:30 형식이어야 합니다.',
  })
  startTime: string;
}
