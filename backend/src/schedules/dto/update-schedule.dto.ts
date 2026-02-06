import { IsDateString, IsOptional, IsString, Matches } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateScheduleDto {
  @ApiPropertyOptional({ example: '2025-02-11' })
  @IsOptional()
  @IsDateString()
  date?: string;

  @ApiPropertyOptional({ example: '10:00' })
  @IsOptional()
  @IsString()
  @Matches(/^([01]\d|2[0-3]):(00|30)$/, {
    message: '시간은 HH:00 또는 HH:30 형식이어야 합니다.',
  })
  startTime?: string;
}
