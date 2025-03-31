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
                pass: 'Hungtu123'
            }
        });
    }

    async sendInvoice(email: string, oederDetails: any) {
        const mailOptions = {
            from: "pamtech.org@gmail.com",
            to: email,
            subject: 'Hoá đơn mua hàng',
            html:`<h2>Xin chào,</h2>
             <p>Cảm ơn bạn đã mua hàng. Dưới đây là chi tiết đơn hàng:</p>
             `
            //  <ul>${orderDetails.items.map(item => `<li>${item.title} - ${item.price}đ</li>`).join('')}</ul>
            //  <p><strong>Tổng tiền: ${orderDetails.totalPrice}đ</strong></p>
        };
        return this.transporter.sendMail(mailOptions);
    }
}
