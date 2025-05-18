import { Injectable } from '@nestjs/common';
import * as qs from 'qs';
import * as crypto from 'crypto';

@Injectable()
export class VnpayService {
  createPaymentUrl(order: { amount: number; orderId: string; bankCode?: string }) {
    const vnp_TmnCode = 'DK40Q8CI';
    const vnp_HashSecret = '42UVDXJJIS9UDHI5FOKD256NWKVFKBOF';
    const vnp_Url = 'https://sandbox.vnpayment.vn/paymentv2/vpcpay.html';
    const vnp_ReturnUrl = 'https://e4fb-171-226-151-242.ngrok-free.app/vnpay-return';

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
      vnp_OrderType: 'other',
      vnp_Amount: (order.amount * 100).toString(),
      vnp_ReturnUrl: vnp_ReturnUrl,
      vnp_CreateDate: createDate,
    };

    if (order.bankCode) {
      vnp_Params['vnp_BankCode'] = order.bankCode;
    }

    // B1: Sắp xếp params
    const sortedParams = Object.keys(vnp_Params)
      .sort()
      .reduce((acc, key) => {
        acc[key] = vnp_Params[key];
        return acc;
      }, {} as Record<string, string>);

    // B2: Tạo chuỗi signData (không encode key, chỉ encode value)
    const signData = qs.stringify(sortedParams, { encode: false });

    // B3: Tạo secureHash
    const hmac = crypto.createHmac('sha512', vnp_HashSecret);
    const signed = hmac.update(signData, 'utf-8').digest('hex');

    // B4: Gắn hash vào params
    sortedParams['vnp_SecureHash'] = signed;

    // B5: Tạo URL (lúc này mới encode value)
    const paymentUrl = `${vnp_Url}?` + qs.stringify(sortedParams, { encode: true });

    // ✅ Debug log
    console.log('✅ signData:', signData);
    console.log('✅ secureHash:', signed);
    console.log('✅ paymentUrl:', paymentUrl);

    return paymentUrl;
  }
}
