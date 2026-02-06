import {
  Injectable,
  NotFoundException,
  ConflictException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between } from 'typeorm';
import { Schedule } from '../entities';
import { CreateScheduleDto } from './dto/create-schedule.dto';
import { UpdateScheduleDto } from './dto/update-schedule.dto';

@Injectable()
export class SchedulesService {
  constructor(
    @InjectRepository(Schedule)
    private readonly scheduleRepository: Repository<Schedule>,
  ) {}

  async findAll(counselorId: string, startDate?: string, endDate?: string) {
    const where: any = { counselorId };

    if (startDate && endDate) {
      where.date = Between(startDate, endDate);
    }

    const schedules = await this.scheduleRepository.find({
      where,
      relations: ['bookings'],
      order: { date: 'ASC', startTime: 'ASC' },
    });

    return schedules.map((schedule) => ({
      id: schedule.id,
      date: schedule.date,
      startTime: schedule.startTime,
      endTime: schedule.endTime,
      maxCapacity: schedule.maxCapacity,
      currentBookings: schedule.bookings?.length ?? 0,
    }));
  }

  async create(counselorId: string, dto: CreateScheduleDto) {
    // 30분 뒤 endTime 계산
    const [hours, minutes] = dto.startTime.split(':').map(Number);
    const endMinutes = minutes + 30;
    const endHours = hours + Math.floor(endMinutes / 60);
    const endTime = `${String(endHours).padStart(2, '0')}:${String(endMinutes % 60).padStart(2, '0')}`;

    // 중복 체크
    const existing = await this.scheduleRepository.findOne({
      where: {
        counselorId,
        date: dto.date,
        startTime: dto.startTime,
      },
    });

    if (existing) {
      throw new ConflictException('해당 날짜/시간에 이미 스케줄이 존재합니다.');
    }

    const schedule = this.scheduleRepository.create({
      counselorId,
      date: dto.date,
      startTime: dto.startTime,
      endTime,
      maxCapacity: 3,
    });

    const saved = await this.scheduleRepository.save(schedule);

    return {
      id: saved.id,
      date: saved.date,
      startTime: saved.startTime,
      endTime: saved.endTime,
      maxCapacity: saved.maxCapacity,
    };
  }

  async update(counselorId: string, id: string, dto: UpdateScheduleDto) {
    const schedule = await this.scheduleRepository.findOne({ where: { id } });

    if (!schedule) {
      throw new NotFoundException('스케줄을 찾을 수 없습니다.');
    }

    if (schedule.counselorId !== counselorId) {
      throw new ForbiddenException('본인의 스케줄만 수정할 수 있습니다.');
    }

    if (dto.date) schedule.date = dto.date;

    if (dto.startTime) {
      schedule.startTime = dto.startTime;
      const [hours, minutes] = dto.startTime.split(':').map(Number);
      const endMinutes = minutes + 30;
      const endHours = hours + Math.floor(endMinutes / 60);
      schedule.endTime = `${String(endHours).padStart(2, '0')}:${String(endMinutes % 60).padStart(2, '0')}`;
    }

    const saved = await this.scheduleRepository.save(schedule);

    return {
      id: saved.id,
      date: saved.date,
      startTime: saved.startTime,
      endTime: saved.endTime,
      maxCapacity: saved.maxCapacity,
    };
  }

  async remove(counselorId: string, id: string) {
    const schedule = await this.scheduleRepository.findOne({ where: { id } });

    if (!schedule) {
      throw new NotFoundException('스케줄을 찾을 수 없습니다.');
    }

    if (schedule.counselorId !== counselorId) {
      throw new ForbiddenException('본인의 스케줄만 삭제할 수 있습니다.');
    }

    await this.scheduleRepository.remove(schedule);

    return { data: null, message: '스케줄이 삭제되었습니다.' };
  }

  async findAvailable(counselorId: string, date?: string) {
    const where: any = { counselorId };
    if (date) where.date = date;

    const schedules = await this.scheduleRepository.find({
      where,
      relations: ['bookings', 'counselor'],
      order: { date: 'ASC', startTime: 'ASC' },
    });

    return schedules.map((schedule) => {
      const currentBookings = schedule.bookings?.length ?? 0;
      return {
        id: schedule.id,
        date: schedule.date,
        startTime: schedule.startTime,
        endTime: schedule.endTime,
        available: currentBookings < schedule.maxCapacity,
        remainingSlots: schedule.maxCapacity - currentBookings,
      };
    });
  }
}
