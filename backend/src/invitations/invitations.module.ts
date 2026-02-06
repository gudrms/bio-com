import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { InvitationsService } from './invitations.service';
import { InvitationsController } from './invitations.controller';
import { InvitationLink, Counselor } from '../entities';
import { EmailModule } from '../email/email.module';

@Module({
  imports: [TypeOrmModule.forFeature([InvitationLink, Counselor]), EmailModule],
  controllers: [InvitationsController],
  providers: [InvitationsService],
  exports: [InvitationsService],
})
export class InvitationsModule {}
