import { Controller, Get, Query, Res } from '@nestjs/common';
import { Response } from 'express';
import { VnpayService } from './payment.service';

@Controller('vnpay')
export class VnpayController {
  constructor(private readonly vnpayService: VnpayService) {}

  @Get('create-payment-url')
  createPaymentUrl(@Query() query: any, @Res() res: Response) {
    const url = this.vnpayService.createPaymentUrl({
      amount: Number(query.amount),
      orderId: query.orderId,
    });

    return res.json({ url }); // Trả về JSON hoặc redirect tùy frontend cần
  }
}