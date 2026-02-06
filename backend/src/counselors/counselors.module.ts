import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CounselorsService } from './counselors.service';
import { Counselor } from '../entities';

@Module({
  imports: [TypeOrmModule.forFeature([Counselor])],
  providers: [CounselorsService],
  exports: [CounselorsService],
})
export class CounselorsModule {}
