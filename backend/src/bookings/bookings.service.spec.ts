import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { DataSource, Repository, EntityManager } from 'typeorm';
import { ConflictException, BadRequestException, NotFoundException } from '@nestjs/common';
import { BookingsService } from './bookings.service';
import { Booking, BookingStatus, Schedule, InvitationLink } from '../entities';

describe('BookingsService', () => {
  let service: BookingsService;
  let mockDataSource: Partial<DataSource>;
  let mockBookingRepo: Partial<Repository<Booking>>;
  let mockScheduleRepo: Partial<Repository<Schedule>>;
  let mockInvitationRepo: Partial<Repository<InvitationLink>>;

  // 트랜잭션 내부에서 사용되는 mock EntityManager
  let mockManager: Partial<EntityManager>;

  const mockSchedule: Partial<Schedule> = {
    id: 'schedule-1',
    counselorId: 'counselor-1',
    date: '2025-03-01',
    startTime: '10:00',
    endTime: '10:30',
    maxCapacity: 3,
  };

  const futureDate = new Date();
  futureDate.setDate(futureDate.getDate() + 7);

  const mockInvitation: Partial<InvitationLink> = {
    id: 'inv-1',
    token: 'valid-token-abc',
    counselorId: 'counselor-1',
    recipientEmail: 'client@test.com',
    expiresAt: futureDate,
    isUsed: false,
  };

  beforeEach(async () => {
    mockManager = {
      findOne: jest.fn(),
      count: jest.fn(),
      create: jest.fn(),
      save: jest.fn(),
      update: jest.fn(),
    };

    mockDataSource = {
      transaction: jest.fn((cb: (manager: EntityManager) => Promise<any>) =>
        cb(mockManager as EntityManager),
      ),
    };

    mockBookingRepo = {
      createQueryBuilder: jest.fn(),
      findOne: jest.fn(),
    };

    mockScheduleRepo = {};
    mockInvitationRepo = {
      findOne: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        BookingsService,
        { provide: getRepositoryToken(Booking), useValue: mockBookingRepo },
        { provide: getRepositoryToken(Schedule), useValue: mockScheduleRepo },
        { provide: getRepositoryToken(InvitationLink), useValue: mockInvitationRepo },
        { provide: DataSource, useValue: mockDataSource },
      ],
    }).compile();

    service = module.get<BookingsService>(BookingsService);
  });

  describe('create (예약 생성)', () => {
    const createDto = {
      scheduleId: 'schedule-1',
      token: 'valid-token-abc',
      clientName: '김철수',
      clientEmail: 'client@test.com',
    };

    it('정상 예약: 잔여석이 있을 때 예약이 생성되어야 한다', async () => {
      // 초대 토큰 유효
      (mockInvitationRepo.findOne as jest.Mock).mockResolvedValue(mockInvitation);

      // 트랜잭션 내부: 스케줄 조회 (비관적 락)
      (mockManager.findOne as jest.Mock).mockResolvedValue(mockSchedule);

      // 현재 예약 수: 2명 (3명 미만이므로 예약 가능)
      (mockManager.count as jest.Mock).mockResolvedValue(2);

      // 예약 생성
      const newBooking = {
        id: 'booking-1',
        scheduleId: 'schedule-1',
        clientName: '김철수',
        clientEmail: 'client@test.com',
        status: BookingStatus.CONFIRMED,
      };
      (mockManager.create as jest.Mock).mockReturnValue(newBooking);
      (mockManager.save as jest.Mock).mockResolvedValue(newBooking);
      (mockManager.update as jest.Mock).mockResolvedValue({ affected: 1 });

      const result = await service.create(createDto);

      expect(result.id).toBe('booking-1');
      expect(result.status).toBe(BookingStatus.CONFIRMED);
      // 초대 토큰이 사용 처리되었는지 확인
      expect(mockManager.update).toHaveBeenCalledWith(
        InvitationLink,
        { token: 'valid-token-abc' },
        { isUsed: true },
      );
    });

    it('동시성 제어: 3명이 이미 예약되었으면 ConflictException(409)', async () => {
      (mockInvitationRepo.findOne as jest.Mock).mockResolvedValue(mockInvitation);
      (mockManager.findOne as jest.Mock).mockResolvedValue(mockSchedule);

      // 이미 3명 예약됨 (max_capacity = 3)
      (mockManager.count as jest.Mock).mockResolvedValue(3);

      await expect(service.create(createDto)).rejects.toThrow(ConflictException);
      await expect(service.create(createDto)).rejects.toThrow('해당 시간대 예약이 마감되었습니다.');
    });

    it('유효하지 않은 토큰이면 BadRequestException', async () => {
      (mockInvitationRepo.findOne as jest.Mock).mockResolvedValue(null);

      await expect(service.create(createDto)).rejects.toThrow(BadRequestException);
      await expect(service.create(createDto)).rejects.toThrow('유효하지 않은 초대 토큰입니다.');
    });

    it('만료된 토큰이면 BadRequestException', async () => {
      const expiredInvitation = {
        ...mockInvitation,
        expiresAt: new Date('2020-01-01'),
      };
      (mockInvitationRepo.findOne as jest.Mock).mockResolvedValue(expiredInvitation);

      await expect(service.create(createDto)).rejects.toThrow(BadRequestException);
      await expect(service.create(createDto)).rejects.toThrow('만료된 초대 토큰입니다.');
    });

    it('이미 사용된 토큰이면 BadRequestException', async () => {
      const usedInvitation = {
        ...mockInvitation,
        isUsed: true,
      };
      (mockInvitationRepo.findOne as jest.Mock).mockResolvedValue(usedInvitation);

      await expect(service.create(createDto)).rejects.toThrow(BadRequestException);
      await expect(service.create(createDto)).rejects.toThrow('이미 사용된 초대 토큰입니다.');
    });

    it('존재하지 않는 스케줄이면 NotFoundException', async () => {
      (mockInvitationRepo.findOne as jest.Mock).mockResolvedValue(mockInvitation);
      (mockManager.findOne as jest.Mock).mockResolvedValue(null);

      await expect(service.create(createDto)).rejects.toThrow(NotFoundException);
    });

    it('비관적 락(pessimistic_write)으로 스케줄을 조회해야 한다', async () => {
      (mockInvitationRepo.findOne as jest.Mock).mockResolvedValue(mockInvitation);
      (mockManager.findOne as jest.Mock).mockResolvedValue(mockSchedule);
      (mockManager.count as jest.Mock).mockResolvedValue(0);
      const newBooking = { id: 'b-1', scheduleId: 'schedule-1', clientName: '김철수', status: BookingStatus.CONFIRMED };
      (mockManager.create as jest.Mock).mockReturnValue(newBooking);
      (mockManager.save as jest.Mock).mockResolvedValue(newBooking);
      (mockManager.update as jest.Mock).mockResolvedValue({ affected: 1 });

      await service.create(createDto);

      // findOne이 pessimistic_write 락으로 호출되었는지 확인
      expect(mockManager.findOne).toHaveBeenCalledWith(Schedule, {
        where: { id: 'schedule-1' },
        lock: { mode: 'pessimistic_write' },
      });
    });

    it('예약 수 확인 시 취소된 예약은 제외해야 한다', async () => {
      (mockInvitationRepo.findOne as jest.Mock).mockResolvedValue(mockInvitation);
      (mockManager.findOne as jest.Mock).mockResolvedValue(mockSchedule);
      (mockManager.count as jest.Mock).mockResolvedValue(0);
      const newBooking = { id: 'b-1', scheduleId: 'schedule-1', clientName: '김철수', status: BookingStatus.CONFIRMED };
      (mockManager.create as jest.Mock).mockReturnValue(newBooking);
      (mockManager.save as jest.Mock).mockResolvedValue(newBooking);
      (mockManager.update as jest.Mock).mockResolvedValue({ affected: 1 });

      await service.create(createDto);

      // count 호출 시 cancelled 제외 조건이 포함되었는지 확인
      expect(mockManager.count).toHaveBeenCalledWith(Booking, {
        where: {
          scheduleId: 'schedule-1',
          status: expect.objectContaining({ _type: 'not' }),
        },
      });
    });
  });
});
