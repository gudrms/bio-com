import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { ConfigService } from '@nestjs/config';
import { BadRequestException } from '@nestjs/common';
import { Repository } from 'typeorm';
import { InvitationsService } from './invitations.service';
import { InvitationLink, Counselor } from '../entities';
import { EmailService } from '../email/email.service';

describe('InvitationsService', () => {
  let service: InvitationsService;
  let mockInvitationRepo: Partial<Repository<InvitationLink>>;
  let mockCounselorRepo: Partial<Repository<Counselor>>;

  const futureDate = new Date();
  futureDate.setDate(futureDate.getDate() + 7);

  const pastDate = new Date('2020-01-01');

  beforeEach(async () => {
    mockInvitationRepo = {
      findOne: jest.fn(),
      create: jest.fn(),
      save: jest.fn(),
    };

    mockCounselorRepo = {
      findOneBy: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        InvitationsService,
        { provide: getRepositoryToken(InvitationLink), useValue: mockInvitationRepo },
        { provide: getRepositoryToken(Counselor), useValue: mockCounselorRepo },
        { provide: ConfigService, useValue: { get: jest.fn().mockReturnValue('http://localhost:3001') } },
        { provide: EmailService, useValue: { sendInvitationEmail: jest.fn().mockResolvedValue(true) } },
      ],
    }).compile();

    service = module.get<InvitationsService>(InvitationsService);
  });

  describe('validate (토큰 검증)', () => {
    it('유효한 토큰이면 상담사 정보를 반환한다', async () => {
      (mockInvitationRepo.findOne as jest.Mock).mockResolvedValue({
        id: 'inv-1',
        token: 'valid-token',
        expiresAt: futureDate,
        isUsed: false,
        counselor: { id: 'c-1', name: '김상담' },
      });

      const result = await service.validate('valid-token');

      expect(result.valid).toBe(true);
      expect(result.counselor.name).toBe('김상담');
    });

    it('존재하지 않는 토큰이면 BadRequestException', async () => {
      (mockInvitationRepo.findOne as jest.Mock).mockResolvedValue(null);

      await expect(service.validate('invalid-token')).rejects.toThrow(BadRequestException);
      await expect(service.validate('invalid-token')).rejects.toThrow('유효하지 않은 토큰입니다.');
    });

    it('만료된 토큰이면 BadRequestException', async () => {
      (mockInvitationRepo.findOne as jest.Mock).mockResolvedValue({
        token: 'expired-token',
        expiresAt: pastDate,
        isUsed: false,
        counselor: { id: 'c-1', name: '김상담' },
      });

      await expect(service.validate('expired-token')).rejects.toThrow(BadRequestException);
      await expect(service.validate('expired-token')).rejects.toThrow('만료된 토큰입니다.');
    });

    it('이미 사용된 토큰이면 BadRequestException', async () => {
      (mockInvitationRepo.findOne as jest.Mock).mockResolvedValue({
        token: 'used-token',
        expiresAt: futureDate,
        isUsed: true,
        counselor: { id: 'c-1', name: '김상담' },
      });

      await expect(service.validate('used-token')).rejects.toThrow(BadRequestException);
      await expect(service.validate('used-token')).rejects.toThrow('이미 사용된 토큰입니다.');
    });
  });

  describe('create (초대 링크 생성)', () => {
    it('초대 링크 생성 시 7일 후 만료 토큰이 생성되어야 한다', async () => {
      const savedInvitation = {
        id: 'inv-1',
        token: 'generated-token',
        expiresAt: futureDate,
      };

      (mockInvitationRepo.create as jest.Mock).mockReturnValue(savedInvitation);
      (mockInvitationRepo.save as jest.Mock).mockResolvedValue(savedInvitation);
      (mockCounselorRepo.findOneBy as jest.Mock).mockResolvedValue({ id: 'c-1', name: '김상담' });

      const result = await service.create('c-1', { recipientEmail: 'client@test.com' });

      expect(result.link).toContain('http://localhost:3001/booking?token=');
      expect(result.expiresAt).toBeDefined();
    });
  });
});
