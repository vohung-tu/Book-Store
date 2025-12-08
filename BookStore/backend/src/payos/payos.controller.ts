import {
  Controller,
  Post,
  Body,
  Headers,
  Req,
  Logger,
  BadRequestException,
} from '@nestjs/common';
import { PayOSService } from './payos.service';
import { CreatePayOSCheckoutDto } from './dto/create-payos-checkout.dto';

@Controller('payos')
export class PayOSController {
  private readonly logger = new Logger(PayOSController.name);

  constructor(private readonly payOSService: PayOSService) {}

  // Tạo link thanh toán
  @Post('create-payment')
  async createPayment(@Body() dto: CreatePayOSCheckoutDto) {
    try {
      const data = await this.payOSService.createCheckout(dto);
      return {
        success: true,
        message: 'Tạo link thanh toán thành công',
        data,
      };
    } catch (error: any) {
      this.logger.error(error);
      throw new BadRequestException(error.message || 'Lỗi tạo thanh toán');
    }
  }

  // Xử lý webhook từ PayOS
  @Post('webhook')
  async handleWebhook(@Req() req: any, @Headers('x-payos-signature') signature: string) {
    try {
      const rawBody = req.rawBody; // Nhớ bật rawBody trong main.ts và app.use(express.raw())

      const data = await this.payOSService.verifyWebhook(rawBody);

      this.logger.log('Webhook PayOS:', data);

      // data.action === 'payment.completed'
      // data.data.amount
      // data.data.orderCode

      return { received: true };
    } catch (error: any) {
      this.logger.error('Webhook Error: ' + error.message);
      return { received: false };
    }
  }
}
