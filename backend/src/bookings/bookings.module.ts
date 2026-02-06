import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BookingsService } from './bookings.service';
import { BookingsController } from './bookings.controller';
import { Booking, Schedule, InvitationLink } from '../entities';

@Module({
  imports: [TypeOrmModule.forFeature([Booking, Schedule, InvitationLink])],
  controllers: [BookingsController],
  providers: [BookingsService],
  exports: [BookingsService],
})
export class BookingsModule {}
