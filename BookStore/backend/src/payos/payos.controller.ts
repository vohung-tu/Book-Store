import { Controller, Get, Post, Query, Body, UseGuards } from '@nestjs/common';
import { PayOSService } from './payos.service';
import { CreatePaymentDto } from './types/dto';
import { PayosWebhookGuard } from './guards/payos-webhook.guard';

@Controller('payos')
export class PayOSController {
  constructor(private readonly payOSService: PayOSService) {}

  /**
   * Tạo link thanh toán PayOS
   * FE sẽ gửi orderId hoặc toàn bộ thông tin đơn hàng vào đây.
   */
  @Post('create-payment')
  async createPayment(@Body() body: CreatePaymentDto): Promise<any> {
    return this.payOSService.createPayment(body);
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
  @UseGuards(PayosWebhookGuard)
  handleWebhook(@Body() body: any) {
    return this.payOSService.handleWebhook(body);
  }
}
