import { Controller, Get, Query, Req, Res } from '@nestjs/common';
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
    '1.1.1.1';
    const clientIp = rawIp === '::1' ? '1.1.1.1' : rawIp;

    const url = this.vnpayService.createPaymentUrl(
      {
        amount: Number(query.amount),
        orderId: query.orderId,
        bankCode: query.bankCode,
      },
      clientIp,
    );

    return { url }; // ✅ Nest sẽ tự chuyển thành JSON
  }

  @Get('vnpay-return')
  handleVnpayReturn(@Query() query: any): any {
    const vnp_Params = { ...query };

    const secureHash = vnp_Params['vnp_SecureHash'];
    const vnp_HashSecret = '3VS4C084VZ9J2SJ5H6O9PDD9GVEJSW91';
    delete vnp_Params['vnp_SecureHash'];
    delete vnp_Params['vnp_SecureHashType'];

    // 1. Sort keys
    const sortedParams = Object.keys(vnp_Params)
      .sort()
      .reduce((acc, key) => {
        acc[key] = vnp_Params[key];
        return acc;
      }, {} as Record<string, string>);

    // 2. Create signData string
    const signData = Object.entries(sortedParams)
      .map(([key, val]) => `${key}=${encodeURIComponent(val)}`)
      .join('&');

    // 3. Generate secure hash
    const generatedHash = crypto
      .createHmac('sha512', vnp_HashSecret)
      .update(signData, 'utf-8')
      .digest('hex');

    if (secureHash === generatedHash) {
      // ✅ Hash khớp: xử lý thành công
      const orderId = vnp_Params['vnp_TxnRef'];
      const responseCode = vnp_Params['vnp_ResponseCode'];

      if (responseCode === '00') {
        // Thành công
        return { message: 'Thanh toán thành công', orderId };
      } else {
        return { message: 'Thanh toán thất bại', responseCode };
      }
    } else {
      // ❌ Hash sai
      return { message: 'Chữ ký không hợp lệ' };
    }
  }
}