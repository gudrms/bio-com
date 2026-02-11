import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource, Not } from 'typeorm';
import { Booking, BookingStatus, Schedule, InvitationLink } from '../entities';
import { CreateBookingDto } from './dto/create-booking.dto';

@Injectable()
export class BookingsService {
  constructor(
    @InjectRepository(Booking)
    private readonly bookingRepository: Repository<Booking>,
    @InjectRepository(Schedule)
    private readonly scheduleRepository: Repository<Schedule>,
    @InjectRepository(InvitationLink)
    private readonly invitationRepository: Repository<InvitationLink>,
    private readonly dataSource: DataSource,
  ) {}

  async create(dto: CreateBookingDto) {
    // 1. 초대 토큰 검증
    const invitation = await this.invitationRepository.findOne({
      where: { token: dto.token },
    });

    if (!invitation) {
      throw new BadRequestException('유효하지 않은 초대 토큰입니다.');
    }

    if (invitation.expiresAt < new Date()) {
      throw new BadRequestException('만료된 초대 토큰입니다.');
    }

    // 2. 트랜잭션 + 비관적 락으로 동시성 제어
    return this.dataSource.transaction(async (manager) => {
      // 비관적 락으로 스케줄 조회 (relations 없이)
      const schedule = await manager.findOne(Schedule, {
        where: { id: dto.scheduleId },
        lock: { mode: 'pessimistic_write' },
      });

      if (!schedule) {
        throw new NotFoundException('스케줄을 찾을 수 없습니다.');
      }

      // 3. 현재 예약 수 확인 (취소된 예약 제외)
      const activeBookingCount = await manager.count(Booking, {
        where: {
          scheduleId: dto.scheduleId,
          status: Not(BookingStatus.CANCELLED),
        },
      });

      if (activeBookingCount >= schedule.maxCapacity) {
        throw new ConflictException('해당 시간대 예약이 마감되었습니다.');
      }

      // 4. 예약 생성
      const booking = manager.create(Booking, {
        scheduleId: dto.scheduleId,
        clientName: dto.clientName,
        clientEmail: dto.clientEmail,
        clientPhone: dto.clientPhone || null,
        status: BookingStatus.CONFIRMED,
      });

      const saved = await manager.save(Booking, booking);

      return {
        id: saved.id,
        scheduleId: saved.scheduleId,
        clientName: saved.clientName,
        status: saved.status,
      };
    });
  }

  async findAll(counselorId: string, scheduleId?: string, status?: string) {
    const queryBuilder = this.bookingRepository
      .createQueryBuilder('booking')
      .innerJoinAndSelect('booking.schedule', 'schedule')
      .where('schedule.counselorId = :counselorId', { counselorId });

    if (scheduleId) {
      queryBuilder.andWhere('booking.scheduleId = :scheduleId', { scheduleId });
    }

    if (status) {
      queryBuilder.andWhere('booking.status = :status', { status });
    }

    queryBuilder.orderBy('schedule.date', 'ASC');
    queryBuilder.addOrderBy('schedule.startTime', 'ASC');

    const bookings = await queryBuilder.getMany();

    return bookings.map((booking) => ({
      id: booking.id,
      schedule: {
        date: booking.schedule.date,
        startTime: booking.schedule.startTime,
      },
      clientName: booking.clientName,
      clientEmail: booking.clientEmail,
      clientPhone: booking.clientPhone,
      status: booking.status,
      createdAt: booking.createdAt,
    }));
  }

  async findOne(id: string) {
    const booking = await this.bookingRepository.findOne({
      where: { id },
      relations: ['schedule', 'consultationRecord'],
    });

    if (!booking) {
      throw new NotFoundException('예약을 찾을 수 없습니다.');
    }

    return booking;
  }
}
