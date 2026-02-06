import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
} from 'typeorm';
import { Schedule } from './schedule.entity';
import { InvitationLink } from './invitation-link.entity';

@Entity('counselors')
export class Counselor {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 255, unique: true })
  email: string;

  @Column({ type: 'varchar', length: 255 })
  password: string;

  @Column({ type: 'varchar', length: 100 })
  name: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @OneToMany(() => Schedule, (schedule) => schedule.counselor)
  schedules: Schedule[];

  @OneToMany(() => InvitationLink, (invitation) => invitation.counselor)
  invitationLinks: InvitationLink[];
}
