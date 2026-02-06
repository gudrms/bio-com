import { Injectable, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import { randomBytes } from 'crypto';
import { InvitationLink, Counselor } from '../entities';
import { CreateInvitationDto } from './dto/create-invitation.dto';
import { EmailService } from '../email/email.service';

@Injectable()
export class InvitationsService {
  constructor(
    @InjectRepository(InvitationLink)
    private readonly invitationRepository: Repository<InvitationLink>,
    @InjectRepository(Counselor)
    private readonly counselorRepository: Repository<Counselor>,
    private readonly configService: ConfigService,
    private readonly emailService: EmailService,
  ) {}

  async create(counselorId: string, dto: CreateInvitationDto) {
    const token = randomBytes(32).toString('hex');
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7); // 7일 후 만료

    const invitation = this.invitationRepository.create({
      counselorId,
      token,
      recipientEmail: dto.recipientEmail,
      expiresAt,
    });

    const saved = await this.invitationRepository.save(invitation);

    const clientUrl = this.configService.get<string>(
      'CLIENT_URL',
      'http://localhost:3001',
    );
    const link = `${clientUrl}/booking?token=${token}`;

    // 상담사 이름 조회 후 이메일 발송
    const counselor = await this.counselorRepository.findOneBy({
      id: counselorId,
    });
    if (counselor) {
      await this.emailService.sendInvitationEmail(
        dto.recipientEmail,
        counselor.name,
        link,
      );
    }

    return {
      id: saved.id,
      token: saved.token,
      link,
      expiresAt: saved.expiresAt,
    };
  }

  async validate(token: string) {
    const invitation = await this.invitationRepository.findOne({
      where: { token },
      relations: ['counselor'],
    });

    if (!invitation) {
      throw new BadRequestException('유효하지 않은 토큰입니다.');
    }

    if (invitation.expiresAt < new Date()) {
      throw new BadRequestException('만료된 토큰입니다.');
    }

    if (invitation.isUsed) {
      throw new BadRequestException('이미 사용된 토큰입니다.');
    }

    return {
      valid: true,
      counselor: {
        id: invitation.counselor.id,
        name: invitation.counselor.name,
      },
      recipientEmail: invitation.recipientEmail,
    };
  }
}
