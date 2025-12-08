import { Controller, Get, Post, Query, Body } from '@nestjs/common';
import { PayOSService } from './payos.service';

@Controller('payos')
export class PayOSController {
  constructor(private readonly payOSService: PayOSService) {}

  /**
   * Tạo link thanh toán PayOS
   * FE sẽ gửi orderId hoặc toàn bộ thông tin đơn hàng vào đây.
   */
  @Post('create-payment')
  async createPayment(@Body() body: any) {
    const { order } = body;

    if (!order || !order.total || !order.code) {
      return { error: 'Thiếu dữ liệu order để tạo thanh toán PayOS' };
    }

    const payment = await this.payOSService.createPayment(order);
    return {
      checkoutUrl: payment.checkoutUrl,
      orderCode: payment.orderCode,
    };
  }

  /**
   * Callback PayOS → hệ thống backend sau khi thanh toán thành công
   * PayOS sẽ gọi URL này
   */
  @Get('return')
  async handleReturn(@Query() query: any) {
    return this.payOSService.handleReturn(query);
  }

  /**
   * Webhook notify → PayOS gửi về trạng thái mới
   * Đây là endpoint quan trọng nhất
   */
  @Post('webhook')
  async handleWebhook(@Body() body: any) {
    return this.payOSService.handleWebhook(body);
  }
}
