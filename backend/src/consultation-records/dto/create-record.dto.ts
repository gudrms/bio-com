import { IsString, IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateRecordDto {
  @ApiProperty({ example: '상담 내용 기록...', description: '상담 내용' })
  @IsString()
  notes: string;
}

export class UpdateRecordDto {
  @ApiProperty({ example: '수정된 상담 내용...', description: '수정된 상담 내용' })
  @IsOptional()
  @IsString()
  notes?: string;
}
