import { Injectable, Logger } from '@nestjs/common';
import PayOS from '@payos/node';
import { CreatePayOSCheckoutDto } from './dto/create-payos-checkout.dto';

@Injectable()
export class PayOSService {
  private readonly logger = new Logger(PayOSService.name);
  private readonly payOS: any;

  constructor() {
    this.payOS = new PayOS(
      process.env.PAYOS_CLIENT_ID!,
      process.env.PAYOS_API_KEY!,
      process.env.PAYOS_CHECKSUM_KEY!,
    );
  }

  async createCheckout(dto: CreatePayOSCheckoutDto) {
    const orderCode = `${Date.now()}${Math.floor(Math.random() * 1000)}`;

    const payload = {
      orderCode,
      amount: dto.amount,
      description: `Thanh toán đơn hàng #${orderCode}`,
      returnUrl: process.env.PAYOS_RETURN_URL,
      cancelUrl: process.env.PAYOS_CANCEL_URL,
      items: dto.items,
    };

    this.logger.log(`Tạo link thanh toán PayOS: ${orderCode}`);

    const res = await this.payOS.createPaymentLink(payload);

    return {
      orderCode,
      checkoutUrl: res.checkoutUrl,
      paymentLinkId: res.paymentLinkId,
    };
  }

  async verifyWebhook(raw: Buffer) {
    return await this.payOS.verifyPaymentWebhook(raw);
  }
}
