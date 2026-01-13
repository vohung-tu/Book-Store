import { Injectable, InternalServerErrorException } from '@nestjs/common';
import * as sgMail from '@sendgrid/mail';

@Injectable()
export class MailService {
  constructor() {
    sgMail.setApiKey(process.env.SENDGRID_API_KEY!);
  }

  async sendResetPasswordEmail(to: string, resetToken: string) {
    const resetLink = `https://book-store-v302.onrender.com/reset-password-link?token=${resetToken}`;

    const msg = {
      to,
      from: {
        email: 'pamtech.org@gmail.com', // email đã verify trên SendGrid
        name: 'Hệ thống Book Store',
      },
      subject: 'Yêu cầu khôi phục mật khẩu',
      html: `
        <p>Chào bạn,</p>
        <p>Chúng tôi nhận được yêu cầu khôi phục mật khẩu.</p>
        <p>Nhấn vào link dưới để đặt lại mật khẩu:</p>
        <a href="${resetLink}">${resetLink}</a>
        <p>Link có hiệu lực trong 1 giờ.</p>
        <p>Nếu bạn không yêu cầu, hãy bỏ qua email này.</p>
      `,
    };

    try {
      await sgMail.send(msg);
      console.log('✅ Email gửi thành công qua SendGrid');
    } catch (error: any) {
      console.error('❌ Lỗi gửi email SendGrid:', error?.response?.body || error);
      throw new InternalServerErrorException('Không thể gửi email');
    }
  }
}
