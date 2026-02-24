import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { NotFoundException, ConflictException, ForbiddenException } from '@nestjs/common';
import { SchedulesService } from './schedules.service';
import { Schedule, BookingStatus } from '../entities';

describe('SchedulesService', () => {
  let service: SchedulesService;
  let mockRepo: Partial<Repository<Schedule>>;

  beforeEach(async () => {
    mockRepo = {
      find: jest.fn(),
      findOne: jest.fn(),
      create: jest.fn(),
      save: jest.fn(),
      remove: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SchedulesService,
        { provide: getRepositoryToken(Schedule), useValue: mockRepo },
      ],
    }).compile();

    service = module.get<SchedulesService>(SchedulesService);
  });

  describe('create (스케줄 생성)', () => {
    it('30분 단위 endTime이 자동 계산되어야 한다', async () => {
      (mockRepo.findOne as jest.Mock).mockResolvedValue(null); // 중복 없음

      const created = {
        id: 's-1',
        counselorId: 'c-1',
        date: '2025-03-01',
        startTime: '14:30',
        endTime: '15:00',
        maxCapacity: 3,
      };
      (mockRepo.create as jest.Mock).mockReturnValue(created);
      (mockRepo.save as jest.Mock).mockResolvedValue(created);

      const result = await service.create('c-1', { date: '2025-03-01', startTime: '14:30' });

      expect(result.startTime).toBe('14:30');
      expect(result.endTime).toBe('15:00');
    });

    it('23:30 시작 시 endTime은 00:00이 되어야 한다', async () => {
      (mockRepo.findOne as jest.Mock).mockResolvedValue(null);

      const created = {
        id: 's-2',
        counselorId: 'c-1',
        date: '2025-03-01',
        startTime: '23:30',
        endTime: '24:00',
        maxCapacity: 3,
      };
      (mockRepo.create as jest.Mock).mockReturnValue(created);
      (mockRepo.save as jest.Mock).mockResolvedValue(created);

      const result = await service.create('c-1', { date: '2025-03-01', startTime: '23:30' });

      // 23:30 + 30분 = 24:00
      expect(result.endTime).toBe('24:00');
    });

    it('동일 날짜/시간에 중복 스케줄이 있으면 ConflictException', async () => {
      (mockRepo.findOne as jest.Mock).mockResolvedValue({ id: 'existing' });

      await expect(
        service.create('c-1', { date: '2025-03-01', startTime: '10:00' }),
      ).rejects.toThrow(ConflictException);
    });
  });

  describe('findAll (스케줄 목록 - 취소 예약 제외)', () => {
    it('취소된 예약을 제외한 currentBookings를 반환해야 한다', async () => {
      const scheduleWithBookings = {
        id: 's-1',
        date: '2025-03-01',
        startTime: '10:00',
        endTime: '10:30',
        maxCapacity: 3,
        bookings: [
          { id: 'b-1', status: BookingStatus.CONFIRMED },
          { id: 'b-2', status: BookingStatus.CANCELLED },  // 취소됨
          { id: 'b-3', status: BookingStatus.COMPLETED },
        ],
      };

      (mockRepo.find as jest.Mock).mockResolvedValue([scheduleWithBookings]);

      const result = await service.findAll('c-1');

      // 3개 예약 중 cancelled 1개 제외 → 2개
      expect(result[0].currentBookings).toBe(2);
    });

    it('예약이 없으면 currentBookings는 0', async () => {
      const emptySchedule = {
        id: 's-1',
        date: '2025-03-01',
        startTime: '10:00',
        endTime: '10:30',
        maxCapacity: 3,
        bookings: [],
      };

      (mockRepo.find as jest.Mock).mockResolvedValue([emptySchedule]);

      const result = await service.findAll('c-1');
      expect(result[0].currentBookings).toBe(0);
    });
  });

  describe('findAvailable (신청자 - 예약 가능 스케줄)', () => {
    it('취소된 예약을 제외하고 잔여석을 계산해야 한다', async () => {
      const schedule = {
        id: 's-1',
        date: '2025-03-01',
        startTime: '10:00',
        endTime: '10:30',
        maxCapacity: 3,
        bookings: [
          { id: 'b-1', status: BookingStatus.CONFIRMED },
          { id: 'b-2', status: BookingStatus.CANCELLED },
        ],
      };

      (mockRepo.find as jest.Mock).mockResolvedValue([schedule]);

      const result = await service.findAvailable('c-1');

      // confirmed 1개만 활성 → 잔여 2석
      expect(result[0].available).toBe(true);
      expect(result[0].remainingSlots).toBe(2);
    });

    it('3명 모두 활성 예약이면 available=false', async () => {
      const fullSchedule = {
        id: 's-1',
        date: '2025-03-01',
        startTime: '10:00',
        endTime: '10:30',
        maxCapacity: 3,
        bookings: [
          { id: 'b-1', status: BookingStatus.CONFIRMED },
          { id: 'b-2', status: BookingStatus.CONFIRMED },
          { id: 'b-3', status: BookingStatus.PENDING },
        ],
      };

      (mockRepo.find as jest.Mock).mockResolvedValue([fullSchedule]);

      const result = await service.findAvailable('c-1');
      expect(result[0].available).toBe(false);
      expect(result[0].remainingSlots).toBe(0);
    });
  });

  describe('update (스케줄 수정)', () => {
    it('본인 스케줄만 수정 가능해야 한다', async () => {
      (mockRepo.findOne as jest.Mock).mockResolvedValue({
        id: 's-1',
        counselorId: 'other-counselor',
      });

      await expect(
        service.update('c-1', 's-1', { startTime: '11:00' }),
      ).rejects.toThrow(ForbiddenException);
    });

    it('존재하지 않는 스케줄이면 NotFoundException', async () => {
      (mockRepo.findOne as jest.Mock).mockResolvedValue(null);

      await expect(
        service.update('c-1', 'nonexistent', { startTime: '11:00' }),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('remove (스케줄 삭제)', () => {
    it('타인의 스케줄은 삭제할 수 없다', async () => {
      (mockRepo.findOne as jest.Mock).mockResolvedValue({
        id: 's-1',
        counselorId: 'other-counselor',
      });

      await expect(service.remove('c-1', 's-1')).rejects.toThrow(ForbiddenException);
    });
  });
});
