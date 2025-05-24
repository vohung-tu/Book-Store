import { Controller, Get, Query, Req, Res } from '@nestjs/common';
import { Request, Response } from 'express';
import { VnpayService } from './payment.service';

@Controller('vnpay')
export class VnpayController {
  constructor(private readonly vnpayService: VnpayService) {}

  @Get('create-payment-url')
  createPaymentUrl(@Query() query: any, @Req() req: Request, @Res() res: Response) {
    const clientIp =
      (req.headers['x-forwarded-for'] as string)?.split(',')[0]?.trim() ||
      req.socket.remoteAddress ||
      '127.0.0.1';

    const url = this.vnpayService.createPaymentUrl(
      {
        amount: Number(query.amount),
        orderId: query.orderId,
        bankCode: query.bankCode, // optional
      },
      clientIp,
    );

    return { url: url };
  }
}