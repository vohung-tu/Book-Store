// mail.service.ts
import { Injectable } from '@nestjs/common';
import * as nodemailer from 'nodemailer';

@Injectable()
export class MailService {
  private transporter = nodemailer.createTransport({
    host: 'smtp.gmail.com',
    port: 465,
    secure: true, // Bắt buộc dùng true cho cổng 465
    auth: {
      user: 'pamtech.org@gmail.com',
      pass: 'dddn qrmy vxky zcxc'
    },
    connectionTimeout: 10000,
    greetingTimeout: 10000,
    socketTimeout: 20000,
    debug: true,
    logger: true
  });

  async sendResetPasswordEmail(to: string, resetToken: string) {
    const resetLink = `https://book-store-v302.onrender.com/reset-password-link?token=${resetToken}`;
    const mailOptions = {
      from: '"Hệ thống" <your_email@gmail.com>',
      to,
      subject: 'Yêu cầu khôi phục mật khẩu',
      html: `
        <p>Chào bạn,</p>
        <p>Chúng tôi nhận được yêu cầu khôi phục mật khẩu.</p>
        <p>Nhấn vào link dưới để đặt lại mật khẩu:</p>
        <a href="${resetLink}">${resetLink}</a>
        <p>Link có hiệu lực trong 1 giờ.</p>
        <p>Nếu bạn không yêu cầu, hãy bỏ qua email này.</p>
      `
    };

    try {
      const info = await this.transporter.sendMail(mailOptions);
      console.log('✅ Email gửi thành công:', info.messageId);
      return info;
    } catch (error) {
      console.error('❌ Lỗi gửi email thực tế:', error);
      throw error;
    }
  }
}
