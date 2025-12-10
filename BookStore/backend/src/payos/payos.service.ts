import { Injectable, BadRequestException } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';
import { OrderDocument } from 'src/order/order/order.schema';
import { ConfigService } from '@nestjs/config';
import { CreatePaymentDto } from './types/dto';
import { generateSignature } from './payos-utils';
import { PayosRequestPaymentPayload } from './dto/payos-request-payment.payload';

@Injectable()
export class PayOSService {

  constructor(private readonly httpService: HttpService,
    private readonly configService: ConfigService
  ) {
  }

  /**
   * Tạo link thanh toán PayOS
   */
  async createPayment(body: CreatePaymentDto): Promise<any> {
    const url = `https://api-merchant.payos.vn/v2/payment-requests`;
    const config = {
      headers: {
        'x-client-id': this.configService.getOrThrow<string>('PAYOS_CLIENT_ID'),
        'x-api-key': this.configService.getOrThrow<string>('PAYOS_API_KEY'),
      },
    };
    const dataForSignature = {
      orderCode: Number(body.orderId),
      amount: body.amount,
      description: body.description,
      cancelUrl: 'https://book-store-v302.onrender.com/cancel',
      returnUrl: 'https://book-store-v302.onrender.com/return',
    };
    const signature = generateSignature(
      dataForSignature,
      this.configService.getOrThrow<string>('PAYOS_CHECKSUM_KEY'),
    );
    const payload: PayosRequestPaymentPayload = {
      ...dataForSignature,
      signature,
    };
    const response = await firstValueFrom(
      this.httpService.post(url, payload, config),
    );
    return response.data;
  }


  /**
   * PayOS redirect người dùng về đây sau thanh toán (không đảm bảo trạng thái)
   */
  async handleReturn(query: any) {
    return {
      message: 'PayOS return URL OK',
      query,
    };
  }

  /**
   * Webhook từ PayOS báo trạng thái thanh toán
   * → Đây mới là trạng thái "chính xác"
   */
  async handleWebhook() {
    return {
      received: true
    };
  }
}
