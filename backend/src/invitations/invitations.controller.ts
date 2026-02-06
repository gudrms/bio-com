import { Controller, Post, Get, Body, Query, UseGuards, Req } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { InvitationsService } from './invitations.service';
import { CreateInvitationDto } from './dto/create-invitation.dto';

@ApiTags('초대 링크')
@Controller('invitations')
export class InvitationsController {
  constructor(private readonly invitationsService: InvitationsService) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: '초대 링크 생성 및 이메일 발송' })
  async create(@Req() req: any, @Body() dto: CreateInvitationDto) {
    const data = await this.invitationsService.create(req.user.id, dto);
    return { data, message: '초대 링크가 생성되었습니다.' };
  }

  @Get('validate')
  @ApiOperation({ summary: '초대 토큰 검증' })
  @ApiQuery({ name: 'token', required: true })
  async validate(@Query('token') token: string) {
    return this.invitationsService.validate(token);
  }
}
