import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConsultationRecordsService } from './consultation-records.service';
import { ConsultationRecordsController } from './consultation-records.controller';
import { ConsultationRecord, Booking } from '../entities';

@Module({
  imports: [TypeOrmModule.forFeature([ConsultationRecord, Booking])],
  controllers: [ConsultationRecordsController],
  providers: [ConsultationRecordsService],
})
export class ConsultationRecordsModule {}
