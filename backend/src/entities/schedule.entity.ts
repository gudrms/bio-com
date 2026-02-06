import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  OneToMany,
  JoinColumn,
  Index,
} from 'typeorm';
import { Counselor } from './counselor.entity';
import { Booking } from './booking.entity';

@Entity('schedules')
@Index('idx_schedules_date_counselor', ['date', 'counselorId'])
export class Schedule {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'counselor_id', type: 'uuid' })
  counselorId: string;

  @Column({ type: 'date' })
  date: string;

  @Column({ name: 'start_time', type: 'time' })
  startTime: string;

  @Column({ name: 'end_time', type: 'time' })
  endTime: string;

  @Column({ name: 'max_capacity', type: 'int', default: 3 })
  maxCapacity: number;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @ManyToOne(() => Counselor, (counselor) => counselor.schedules, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'counselor_id' })
  counselor: Counselor;

  @OneToMany(() => Booking, (booking) => booking.schedule)
  bookings: Booking[];
}
