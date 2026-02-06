import {
  IsUUID,
  IsEmail,
  IsString,
  IsOptional,
  Matches,
  Length,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateBookingDto {
  @ApiProperty({ description: '스케줄 ID' })
  @IsUUID()
  scheduleId: string;

  @ApiProperty({ description: '초대 토큰' })
  @IsString()
  token: string;

  @ApiProperty({ example: '김철수', description: '신청자 이름' })
  @IsString()
  @Length(2, 50)
  clientName: string;

  @ApiProperty({ example: 'client@example.com', description: '신청자 이메일' })
  @IsEmail()
  clientEmail: string;

  @ApiPropertyOptional({ example: '010-1234-5678', description: '신청자 연락처' })
  @IsOptional()
  @Matches(/^01[0-9]-\d{3,4}-\d{4}$/, {
    message: '올바른 전화번호 형식이 아닙니다. (예: 010-1234-5678)',
  })
  clientPhone?: string;
}
