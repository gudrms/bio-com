import { IsEmail } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateInvitationDto {
  @ApiProperty({ example: 'client@example.com', description: '수신자 이메일' })
  @IsEmail()
  recipientEmail: string;
}
