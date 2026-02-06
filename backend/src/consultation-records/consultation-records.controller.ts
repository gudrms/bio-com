import {
  Controller,
  Post,
  Put,
  Get,
  Body,
  Param,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { ConsultationRecordsService } from './consultation-records.service';
import { CreateRecordDto, UpdateRecordDto } from './dto/create-record.dto';

@ApiTags('상담 기록')
@Controller('bookings/:bookingId/records')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class ConsultationRecordsController {
  constructor(private readonly recordsService: ConsultationRecordsService) {}

  @Post()
  @ApiOperation({ summary: '상담 기록 작성' })
  async create(
    @Param('bookingId') bookingId: string,
    @Body() dto: CreateRecordDto,
  ) {
    return this.recordsService.create(bookingId, dto);
  }

  @Put()
  @ApiOperation({ summary: '상담 기록 수정' })
  async update(
    @Param('bookingId') bookingId: string,
    @Body() dto: UpdateRecordDto,
  ) {
    return this.recordsService.update(bookingId, dto);
  }

  @Get()
  @ApiOperation({ summary: '상담 기록 조회' })
  async findOne(@Param('bookingId') bookingId: string) {
    return this.recordsService.findByBookingId(bookingId);
  }
}
