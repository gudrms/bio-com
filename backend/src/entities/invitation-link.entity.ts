import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { Counselor } from './counselor.entity';

@Entity('invitation_links')
@Index('idx_invitation_token', ['token'])
export class InvitationLink {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'counselor_id', type: 'uuid' })
  counselorId: string;

  @Column({ type: 'varchar', length: 255, unique: true })
  token: string;

  @Column({ name: 'recipient_email', type: 'varchar', length: 255 })
  recipientEmail: string;

  @Column({ name: 'expires_at', type: 'timestamp' })
  expiresAt: Date;

  @Column({ name: 'is_used', type: 'boolean', default: false })
  isUsed: boolean;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @ManyToOne(() => Counselor, (counselor) => counselor.invitationLinks, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'counselor_id' })
  counselor: Counselor;
}
