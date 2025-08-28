import { Controller, Get, Query, Req } from '@nestjs/common';
import { Request } from 'express';
import { VnpayService } from './payment.service';
import * as crypto from 'crypto';

@Controller('vnpay')
export class VnpayController {
  constructor(private readonly vnpayService: VnpayService) {}

  @Get('create-payment-url')
  createPaymentUrl(@Query() query: any, @Req() req: Request) {
    const rawIp =
      (req.headers['x-forwarded-for'] as string)?.split(',')[0]?.trim() ||
      req.socket.remoteAddress ||
      '127.0.0.1';
    const clientIp = rawIp === '::1' ? '127.0.0.1' : rawIp;

    const url = this.vnpayService.createPaymentUrl(
      {
        amount: Number(query.amount),
        orderId: query.orderId,
        bankCode: query.bankCode,
      },
      clientIp,
    );

    return { url };
  }

  @Get('vnpay-return')
  handleVnpayReturn(@Query() query: any) {
    const vnp_Params = { ...query };
    const secureHash = vnp_Params['vnp_SecureHash'];
    const vnp_HashSecret = '42UVDXJJIS9UDHI5FOKD256NWKVFKBOF';

    delete vnp_Params['vnp_SecureHash'];
    delete vnp_Params['vnp_SecureHashType'];

    // sort key
    const sortedParams = Object.keys(vnp_Params)
      .sort()
      .reduce((acc, key) => {
        acc[key] = vnp_Params[key];
        return acc;
      }, {} as Record<string, string>);

    const signData = Object.entries(sortedParams)
      .map(([k, v]) => `${k}=${v}`)
      .join('&');

    const generatedHash = crypto
      .createHmac('sha512', vnp_HashSecret)
      .update(signData, 'utf-8')
      .digest('hex');

    if (secureHash === generatedHash) {
      const orderId = vnp_Params['vnp_TxnRef'];
      const responseCode = vnp_Params['vnp_ResponseCode'];

      if (responseCode === '00') {
        return { message: 'Thanh toán thành công', orderId };
      } else {
        return { message: 'Thanh toán thất bại', code: responseCode };
      }
    } else {
      return { message: 'Sai chữ ký, giao dịch không hợp lệ' };
    }
  }
}
