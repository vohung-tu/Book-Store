import { Injectable } from '@nestjs/common';
import * as qs from 'qs';
import * as crypto from 'crypto';

@Injectable()
export class VnpayService {
  createPaymentUrl(
    order: { amount: number; orderId: string; bankCode?: string },
    clientIp: string,
  ) {
    const vnp_TmnCode = 'DK40Q8CI';
    const vnp_HashSecret = '42UVDXJJIS9UDHI5FOKD256NWKVFKBOF';
    const vnp_Url = 'https://sandbox.vnpayment.vn/paymentv2/vpcpay.html';
    const vnp_ReturnUrl = 'https://merchant.com/return';

    const date = new Date();
    const createDate = `${date.getFullYear()}${(date.getMonth() + 1)
      .toString()
      .padStart(2, '0')}${date.getDate().toString().padStart(2, '0')}${date
      .getHours()
      .toString()
      .padStart(2, '0')}${date.getMinutes().toString().padStart(2, '0')}${date
      .getSeconds()
      .toString()
      .padStart(2, '0')}`;

    const orderId = order.orderId;

    const vnp_Params: Record<string, string> = {
      vnp_Version: '2.1.0',
      vnp_Command: 'pay',
      vnp_TmnCode: vnp_TmnCode,
      vnp_Locale: 'vn',
      vnp_CurrCode: 'VND',
      vnp_TxnRef: orderId,
      vnp_OrderInfo: `Thanh toan don hang #${orderId}`,
      vnp_OrderType: 'topup',
      vnp_Amount: Math.round(order.amount * 100).toString(),
      vnp_ReturnUrl: vnp_ReturnUrl,
      vnp_CreateDate: createDate,
      vnp_IpAddr: clientIp, // ✅ client IP từ controller
    };

    if (order.bankCode) {
      vnp_Params['vnp_BankCode'] = order.bankCode;
    }

    const sortedParams = Object.keys(vnp_Params)
      .sort()
      .reduce((acc, key) => {
        acc[key] = vnp_Params[key];
        return acc;
      }, {} as Record<string, string>);

    const signData = qs.stringify(sortedParams, { encode: false });
    const hmac = crypto.createHmac('sha512', vnp_HashSecret);
    const signed = hmac.update(signData, 'utf-8').digest('hex');

    sortedParams['vnp_SecureHash'] = signed;

    const paymentUrl = `${vnp_Url}?` + qs.stringify(sortedParams, { encode: true });

    return paymentUrl;
  }
}
