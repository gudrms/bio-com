import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ConsultationRecord, Booking } from '../entities';
import { CreateRecordDto, UpdateRecordDto } from './dto/create-record.dto';

@Injectable()
export class ConsultationRecordsService {
  constructor(
    @InjectRepository(ConsultationRecord)
    private readonly recordRepository: Repository<ConsultationRecord>,
    @InjectRepository(Booking)
    private readonly bookingRepository: Repository<Booking>,
  ) {}

  async create(bookingId: string, dto: CreateRecordDto) {
    const booking = await this.bookingRepository.findOne({
      where: { id: bookingId },
    });

    if (!booking) {
      throw new NotFoundException('예약을 찾을 수 없습니다.');
    }

    const existing = await this.recordRepository.findOne({
      where: { bookingId },
    });

    if (existing) {
      throw new ConflictException('이미 상담 기록이 존재합니다.');
    }

    const record = this.recordRepository.create({
      bookingId,
      notes: dto.notes,
    });

    const saved = await this.recordRepository.save(record);

    return {
      id: saved.id,
      bookingId: saved.bookingId,
      notes: saved.notes,
      createdAt: saved.createdAt,
    };
  }

  async update(bookingId: string, dto: UpdateRecordDto) {
    const record = await this.recordRepository.findOne({
      where: { bookingId },
    });

    if (!record) {
      throw new NotFoundException('상담 기록을 찾을 수 없습니다.');
    }

    if (dto.notes !== undefined) {
      record.notes = dto.notes;
    }

    const saved = await this.recordRepository.save(record);

    return {
      id: saved.id,
      bookingId: saved.bookingId,
      notes: saved.notes,
      updatedAt: saved.updatedAt,
    };
  }

  async findByBookingId(bookingId: string) {
    const record = await this.recordRepository.findOne({
      where: { bookingId },
    });

    if (!record) {
      throw new NotFoundException('상담 기록을 찾을 수 없습니다.');
    }

    return record;
  }
}
