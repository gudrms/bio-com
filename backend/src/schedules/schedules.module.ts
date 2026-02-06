import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SchedulesService } from './schedules.service';
import { SchedulesController } from './schedules.controller';
import { Schedule } from '../entities';
import { InvitationsModule } from '../invitations/invitations.module';

@Module({
  imports: [TypeOrmModule.forFeature([Schedule]), InvitationsModule],
  controllers: [SchedulesController],
  providers: [SchedulesService],
  exports: [SchedulesService],
})
export class SchedulesModule {}
