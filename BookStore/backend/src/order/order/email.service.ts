import { Injectable } from '@nestjs/common';
import * as nodemailer from 'nodemailer';

@Injectable()
export class EmailService {
  private transporter;

  constructor() {
    this.transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: 'pamtech.org@gmail.com',
        pass: 'Hungtu123' // 👉 Nên dùng app password nếu bật 2FA
      }
    });
  }

  async sendInvoice(email: string, orderDetails: any) {
    const { name, products, total } = orderDetails;

    const itemsHtml = products
      .map(
        (item: any) =>
          `<tr>
            <td>${item.title}</td>
            <td style="text-align:center;">${item.quantity || 1}</td>
            <td style="text-align:right;">${(item.flashsale_price || item.price).toLocaleString()}đ</td>
          </tr>`
      )
      .join('');

    const htmlContent = `
      <div style="font-family: Arial, sans-serif; line-height: 1.6;">
        <h2>Xin chào ${name},</h2>
        <p>Cảm ơn bạn đã mua hàng tại PAMTECH! Dưới đây là chi tiết đơn hàng của bạn:</p>
        <table border="1" cellpadding="10" cellspacing="0" style="border-collapse: collapse; width: 100%;">
          <thead>
            <tr style="background-color: #f2f2f2;">
              <th>Sản phẩm</th>
              <th>Số lượng</th>
              <th>Giá</th>
            </tr>
          </thead>
          <tbody>
            ${itemsHtml}
          </tbody>
        </table>
        <p style="margin-top: 10px;"><strong>Tổng tiền: ${total.toLocaleString()}đ</strong></p>
        <p>Chúng tôi sẽ sớm liên hệ để giao hàng cho bạn.</p>
        <p>Trân trọng,<br><strong>PAMTECH Team</strong></p>
      </div>
    `;

    const mailOptions = {
      from: 'pamtech.org@gmail.com',
      to: email,
      subject: '🧾 Hóa đơn mua hàng từ PAMTECH',
      html: htmlContent
    };

    return this.transporter.sendMail(mailOptions);
  }
}
