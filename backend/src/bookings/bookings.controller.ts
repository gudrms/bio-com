import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  UseGuards,
  Req,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { BookingsService } from './bookings.service';
import { CreateBookingDto } from './dto/create-booking.dto';

@ApiTags('예약')
@Controller('bookings')
export class BookingsController {
  constructor(private readonly bookingsService: BookingsService) {}

  @Post()
  @ApiOperation({ summary: '예약 신청 (신청자)' })
  async create(@Body() dto: CreateBookingDto) {
    const data = await this.bookingsService.create(dto);
    return { data, message: '예약이 완료되었습니다.' };
  }

  @Get()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: '예약 목록 조회 (상담사)' })
  @ApiQuery({ name: 'scheduleId', required: false })
  @ApiQuery({ name: 'status', required: false })
  async findAll(
    @Req() req: any,
    @Query('scheduleId') scheduleId?: string,
    @Query('status') status?: string,
  ) {
    return this.bookingsService.findAll(req.user.id, scheduleId, status);
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: '예약 상세 조회' })
  async findOne(@Param('id') id: string) {
    return this.bookingsService.findOne(id);
  }
}
