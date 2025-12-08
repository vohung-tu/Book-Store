import { Injectable, Logger } from '@nestjs/common';
import PayOS = require('@payos/node');
import { CreatePayOSCheckoutDto } from './dto/create-payos-checkout.dto';

@Injectable()
export class PayOSService {
  private readonly logger = new Logger(PayOSService.name);
  private readonly payOS: any;

  constructor() {
    console.log("🔍 PAYOS_CLIENT_ID:", process.env.PAYOS_CLIENT_ID);
    console.log("🔍 PAYOS_API_KEY:", process.env.PAYOS_API_KEY);
    console.log("🔍 PAYOS_CHECKSUM_KEY:", process.env.PAYOS_CHECKSUM_KEY);

    console.log("🔍 RETURN_URL:", process.env.PAYOS_RETURN_URL);
    console.log("🔍 CANCEL_URL:", process.env.PAYOS_CANCEL_URL);
    this.payOS = new PayOS(
      process.env.PAYOS_CLIENT_ID ?? '',
      process.env.PAYOS_API_KEY ?? '',
      process.env.PAYOS_CHECKSUM_KEY ?? '',
    );
  }

  async createCheckout(dto: CreatePayOSCheckoutDto) {
    const orderCode = Number(`${Date.now()}${Math.floor(Math.random() * 1000)}`);

    const payload = {
      orderCode,
      amount: dto.amount,
      description: `Thanh toán đơn hàng #${orderCode}`,
      returnUrl: "https://book-store-v302.onrender.com/payment-result",
      cancelUrl: "https://book-store-v302.onrender.com/checkout",
      items: dto.items,
    };

    const res = await this.payOS.createPaymentLink(payload);

    return {
      orderCode,
      checkoutUrl: res.checkoutUrl,
      paymentLinkId: res.paymentLinkId,
    };
  }

  async verifyWebhook(raw: Buffer) {
    return this.payOS.verifyPaymentWebhook(raw);
  }
}
