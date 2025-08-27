import { Injectable } from '@nestjs/common';
import * as qs from 'qs';
import * as crypto from 'crypto';

@Injectable()
export class VnpayService {
  createPaymentUrl(
    order: { amount: number; orderId: string; bankCode?: string },
    clientIp: string,
  ) {
    const vnp_TmnCode = 'DK40Q8CI'; // ✅ thay bằng mã của bạn
    const vnp_HashSecret = '42UVDXJJIS9UDHI5FOKD256NWKVFKBOF'; // ✅ secret của bạn
    const vnp_Url = 'https://sandbox.vnpayment.vn/paymentv2/vpcpay.html';
    const vnp_ReturnUrl = 'https://book-store-v302.onrender.com/vnpay/vnpay-return'; // ✅ sửa theo domain thực tế

    const date = new Date();
    const pad = (n: number) => n.toString().padStart(2, '0');
    const createDate = `${date.getFullYear()}${pad(date.getMonth() + 1)}${pad(date.getDate())}${pad(date.getHours())}${pad(date.getMinutes())}${pad(date.getSeconds())}`;

    // hạn thanh toán (1 ngày sau)
    const tomorrow = new Date(date);
    tomorrow.setDate(tomorrow.getDate() + 1);
    const expireDate = `${tomorrow.getFullYear()}${pad(tomorrow.getMonth() + 1)}${pad(tomorrow.getDate())}${pad(tomorrow.getHours())}${pad(tomorrow.getMinutes())}${pad(tomorrow.getSeconds())}`;

    const orderId = order.orderId;

    const vnp_Params: Record<string, string> = {
      vnp_Version: '2.1.0',
      vnp_Command: 'pay',
      vnp_TmnCode,
      vnp_Amount: Math.round(order.amount * 100).toString(),
      vnp_CurrCode: 'VND',
      vnp_TxnRef: orderId,
      vnp_OrderInfo: `Thanh toan don hang ${orderId}`,
      vnp_OrderType: 'other',
      vnp_Locale: 'vn',
      vnp_ReturnUrl,
      vnp_IpAddr: clientIp,
      vnp_CreateDate: createDate,
      vnp_ExpireDate: expireDate,
    };

    if (order.bankCode) {
      vnp_Params['vnp_BankCode'] = order.bankCode;
    }

    // sort key
    const sortedParams = Object.keys(vnp_Params)
      .sort()
      .reduce((acc, key) => {
        acc[key] = vnp_Params[key];
        return acc;
      }, {} as Record<string, string>);

    // raw string để ký (❌ không encode)
    const signData = Object.entries(sortedParams)
      .map(([k, v]) => `${k}=${v}`)
      .join('&');

    const signed = crypto
      .createHmac('sha512', vnp_HashSecret)
      .update(signData, 'utf-8')
      .digest('hex');

    sortedParams['vnp_SecureHash'] = signed;

    // build URL có encode
    const paymentUrl = `${vnp_Url}?` + qs.stringify(sortedParams, { encode: true });
    console.log('SignData:', signData);
    console.log('Signed Hash:', signed);
    console.log('Payment URL:', paymentUrl);
    return paymentUrl;
  }
}
