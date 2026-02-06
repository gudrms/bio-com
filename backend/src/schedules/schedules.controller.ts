import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  Req,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { SchedulesService } from './schedules.service';
import { InvitationsService } from '../invitations/invitations.service';
import { CreateScheduleDto } from './dto/create-schedule.dto';
import { UpdateScheduleDto } from './dto/update-schedule.dto';

@ApiTags('스케줄')
@Controller('schedules')
export class SchedulesController {
  constructor(
    private readonly schedulesService: SchedulesService,
    private readonly invitationsService: InvitationsService,
  ) {}

  @Get()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: '스케줄 목록 조회 (상담사)' })
  @ApiQuery({ name: 'startDate', required: false })
  @ApiQuery({ name: 'endDate', required: false })
  async findAll(
    @Req() req: any,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    return this.schedulesService.findAll(req.user.id, startDate, endDate);
  }

  @Post()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: '스케줄 생성' })
  async create(@Req() req: any, @Body() dto: CreateScheduleDto) {
    return this.schedulesService.create(req.user.id, dto);
  }

  @Put(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: '스케줄 수정' })
  async update(
    @Req() req: any,
    @Param('id') id: string,
    @Body() dto: UpdateScheduleDto,
  ) {
    return this.schedulesService.update(req.user.id, id, dto);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: '스케줄 삭제' })
  async remove(@Req() req: any, @Param('id') id: string) {
    return this.schedulesService.remove(req.user.id, id);
  }

  @Get('available')
  @ApiOperation({ summary: '예약 가능 스케줄 조회 (신청자)' })
  @ApiQuery({ name: 'token', required: true })
  @ApiQuery({ name: 'date', required: false })
  async findAvailable(
    @Query('token') token: string,
    @Query('date') date?: string,
  ) {
    const { counselor } = await this.invitationsService.validate(token);
    const schedules = await this.schedulesService.findAvailable(
      counselor.id,
      date,
    );
    return { counselor, schedules };
  }
}
