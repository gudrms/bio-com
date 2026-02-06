import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  OneToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { Schedule } from './schedule.entity';
import { ConsultationRecord } from './consultation-record.entity';

export enum BookingStatus {
  PENDING = 'pending',
  CONFIRMED = 'confirmed',
  CANCELLED = 'cancelled',
  COMPLETED = 'completed',
}

@Entity('bookings')
@Index('idx_bookings_schedule', ['scheduleId'])
@Index('idx_bookings_status', ['status'])
export class Booking {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'schedule_id', type: 'uuid' })
  scheduleId: string;

  @Column({ name: 'client_name', type: 'varchar', length: 100 })
  clientName: string;

  @Column({ name: 'client_email', type: 'varchar', length: 255 })
  clientEmail: string;

  @Column({ name: 'client_phone', type: 'varchar', length: 20, nullable: true })
  clientPhone: string | null;

  @Column({
    type: 'enum',
    enum: BookingStatus,
    default: BookingStatus.CONFIRMED,
  })
  status: BookingStatus;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @ManyToOne(() => Schedule, (schedule) => schedule.bookings, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'schedule_id' })
  schedule: Schedule;

  @OneToOne(() => ConsultationRecord, (record) => record.booking)
  consultationRecord: ConsultationRecord;
}
