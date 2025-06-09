// mail.service.ts
import { Injectable } from '@nestjs/common';
import * as nodemailer from 'nodemailer';

@Injectable()
export class MailService {
  private transporter = nodemailer.createTransport({
    service: 'gmail', // hoặc 'hotmail', 'outlook', SMTP...
    auth: {
      user: 'pamtech.org@gmail.com',
      pass: 'gxve tebv ngfr paxt'
    }
  });

  async sendResetPasswordEmail(to: string, resetToken: string) {
    const resetLink = `https://book-store-aquj.onrender.com/reset-password-link?token=${resetToken}`;
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

    await this.transporter.sendMail(mailOptions);
  }
}
