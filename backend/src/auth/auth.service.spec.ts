import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { JwtService } from '@nestjs/jwt';
import { UnauthorizedException } from '@nestjs/common';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { AuthService } from './auth.service';
import { Counselor } from '../entities';

describe('AuthService', () => {
  let service: AuthService;
  let mockCounselorRepo: Partial<Repository<Counselor>>;
  let mockJwtService: Partial<JwtService>;

  const hashedPassword = bcrypt.hashSync('password123', 10);

  const mockCounselor: Partial<Counselor> = {
    id: 'c-1',
    email: 'counselor1@example.com',
    password: hashedPassword,
    name: '김상담',
  };

  beforeEach(async () => {
    mockCounselorRepo = {
      findOne: jest.fn(),
    };

    mockJwtService = {
      sign: jest.fn().mockReturnValue('mocked-jwt-token'),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: getRepositoryToken(Counselor), useValue: mockCounselorRepo },
        { provide: JwtService, useValue: mockJwtService },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
  });

  describe('login', () => {
    it('올바른 이메일/비밀번호로 로그인하면 JWT 토큰 반환', async () => {
      (mockCounselorRepo.findOne as jest.Mock).mockResolvedValue(mockCounselor);

      const result = await service.login({
        email: 'counselor1@example.com',
        password: 'password123',
      });

      expect(result.accessToken).toBe('mocked-jwt-token');
      expect(result.user.email).toBe('counselor1@example.com');
      expect(result.user.name).toBe('김상담');
      // 비밀번호가 응답에 포함되지 않아야 함
      expect((result.user as any).password).toBeUndefined();
    });

    it('JWT payload에 sub, email, role이 포함되어야 한다', async () => {
      (mockCounselorRepo.findOne as jest.Mock).mockResolvedValue(mockCounselor);

      await service.login({
        email: 'counselor1@example.com',
        password: 'password123',
      });

      expect(mockJwtService.sign).toHaveBeenCalledWith({
        sub: 'c-1',
        email: 'counselor1@example.com',
        role: 'counselor',
      });
    });

    it('존재하지 않는 이메일이면 UnauthorizedException', async () => {
      (mockCounselorRepo.findOne as jest.Mock).mockResolvedValue(null);

      await expect(
        service.login({ email: 'wrong@test.com', password: 'password123' }),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('비밀번호가 틀리면 UnauthorizedException', async () => {
      (mockCounselorRepo.findOne as jest.Mock).mockResolvedValue(mockCounselor);

      await expect(
        service.login({ email: 'counselor1@example.com', password: 'wrongpassword' }),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('에러 메시지가 이메일/비밀번호 중 어느 것이 틀렸는지 구분하지 않아야 한다 (보안)', async () => {
      // 존재하지 않는 이메일
      (mockCounselorRepo.findOne as jest.Mock).mockResolvedValue(null);

      try {
        await service.login({ email: 'wrong@test.com', password: 'password123' });
      } catch (e: any) {
        expect(e.message).toBe('이메일 또는 비밀번호가 올바르지 않습니다.');
      }

      // 틀린 비밀번호
      (mockCounselorRepo.findOne as jest.Mock).mockResolvedValue(mockCounselor);

      try {
        await service.login({ email: 'counselor1@example.com', password: 'wrong' });
      } catch (e: any) {
        // 동일한 메시지 → 공격자가 이메일 존재 여부를 추론할 수 없음
        expect(e.message).toBe('이메일 또는 비밀번호가 올바르지 않습니다.');
      }
    });
  });
});
