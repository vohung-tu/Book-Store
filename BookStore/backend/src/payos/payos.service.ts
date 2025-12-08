import { Injectable, BadRequestException } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';
import { OrderDocument } from 'src/order/order/order.schema';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class PayOSService {
  private readonly clientId = process.env.PAYOS_CLIENT_ID;
  private readonly apiKey = process.env.PAYOS_API_KEY;
  private readonly checksumKey = process.env.PAYOS_CHECKSUM_KEY;

  constructor(private readonly httpService: HttpService,
    private readonly configService: ConfigService
  ) {
    if (!this.clientId || !this.apiKey || !this.checksumKey) {
      console.error('[PayOS] Missing environment variables');
    }
  }

  /**
   * Tạo link thanh toán PayOS
   */
  async createPayment(order: OrderDocument) {
    const body = {
      orderCode: order.code,
      amount: order.total,
      description: `Thanh toán đơn hàng ${order.code}`,

      // ⚡ Lấy theo ENV bạn đã cung cấp
      returnUrl: this.configService.get<string>('PAYOS_RETURN_URL'),
      cancelUrl: this.configService.get<string>('PAYOS_CANCEL_URL'),
    };

    try {
      const response = await this.httpService.axiosRef.post(
        'https://api.payos.vn/v2/payment-requests',
        body,
        {
          headers: {
            'x-client-id': this.configService.get('PAYOS_CLIENT_ID'),
            'x-api-key': this.configService.get('PAYOS_API_KEY'),
          },
        },
      );

      return response.data;
    } catch (error) {
      console.error(error.response?.data || error);
      throw new BadRequestException('Không tạo được yêu cầu thanh toán');
    }
  }

  /**
   * Generate signature PayOS (bắt buộc)
   */
  private generateSignature(order: any) {
    const raw = `${order.code}|${order.total}|${this.checksumKey}`;
    const crypto = require('crypto');
    return crypto.createHash('sha256').update(raw).digest('hex');
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
  async handleWebhook(body: any) {
    console.log('[PayOS] Webhook received:', body);

    const { data } = body;

    if (!data) {
      throw new BadRequestException('Webhook không hợp lệ');
    }

    return {
      success: true,
      orderCode: data.orderCode,
      status: data.status,
    };
  }
}
