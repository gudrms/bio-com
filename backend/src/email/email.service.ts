import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';

@Injectable()
export class EmailService {
  private transporter: nodemailer.Transporter;

  constructor(private readonly configService: ConfigService) {
    this.transporter = nodemailer.createTransport({
      host: this.configService.get<string>('SMTP_HOST', 'smtp.gmail.com'),
      port: this.configService.get<number>('SMTP_PORT', 587),
      secure: false,
      auth: {
        user: this.configService.get<string>('SMTP_USER'),
        pass: this.configService.get<string>('SMTP_PASS'),
      },
    });
  }

  async sendInvitationEmail(
    recipientEmail: string,
    counselorName: string,
    link: string,
  ) {
    const mailOptions = {
      from: this.configService.get<string>('SMTP_USER'),
      to: recipientEmail,
      subject: `[상담 예약] ${counselorName} 상담사의 예약 초대`,
      html: `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
          <h2>상담 예약 초대</h2>
          <p>${counselorName} 상담사가 상담 예약을 초대했습니다.</p>
          <p>아래 링크를 클릭하여 상담 일정을 예약해주세요.</p>
          <a href="${link}" style="display: inline-block; padding: 12px 24px; background-color: #4F46E5; color: white; text-decoration: none; border-radius: 6px; margin: 16px 0;">
            예약하기
          </a>
          <p style="color: #666; font-size: 14px;">이 링크는 7일 후 만료됩니다.</p>
        </div>
      `,
    };

    try {
      await this.transporter.sendMail(mailOptions);
      return true;
    } catch (error) {
      console.error('이메일 발송 실패:', error);
      return false;
    }
  }
}
