import { Injectable, OnModuleInit } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { Counselor } from '../entities';

@Injectable()
export class CounselorsService implements OnModuleInit {
  constructor(
    @InjectRepository(Counselor)
    private readonly counselorRepository: Repository<Counselor>,
  ) {}

  async onModuleInit() {
    await this.seedCounselors();
  }

  private async seedCounselors() {
    const count = await this.counselorRepository.count();
    if (count > 0) return;

    const hashedPassword = await bcrypt.hash('password123', 10);

    const counselors = [
      {
        email: 'counselor1@example.com',
        password: hashedPassword,
        name: '김상담',
      },
      {
        email: 'counselor2@example.com',
        password: hashedPassword,
        name: '이상담',
      },
    ];

    await this.counselorRepository.save(counselors);
    console.log('시드 상담사 데이터가 생성되었습니다.');
  }

  async findById(id: string): Promise<Counselor | null> {
    return this.counselorRepository.findOne({ where: { id } });
  }

  async findByEmail(email: string): Promise<Counselor | null> {
    return this.counselorRepository.findOne({ where: { email } });
  }
}
