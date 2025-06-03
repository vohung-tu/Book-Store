import { Injectable } from '@nestjs/common';
import * as qs from 'qs';
import * as crypto from 'crypto';

@Injectable()
export class VnpayService {
  createPaymentUrl(
    order: { amount: number; orderId: string; bankCode?: string },
    clientIp: string,
  ) {
    const vnp_TmnCode = 'FLD0VC88';
    const vnp_HashSecret = '3VS4C084VZ9J2SJ5H6O9PDD9GVEJSW91';
    const vnp_Url = 'https://sandbox.vnpayment.vn/paymentv2/vpcpay.html';
    const vnp_ReturnUrl = ' https://8f1c-1-55-26-252.ngrok-free.app/vnpay/vnpay-return';

    const date = new Date();
    const pad = (n: number) => n.toString().padStart(2, '0');
    const createDate = `${date.getFullYear()}${pad(date.getMonth() + 1)}${pad(date.getDate())}${pad(date.getHours())}${pad(date.getMinutes())}${pad(date.getSeconds())}`;
    // Tạo vnp_ExpireDate (1 ngày sau)
    const tomorrow = new Date(date);
    tomorrow.setDate(tomorrow.getDate() + 1);
    const expireDate = `${tomorrow.getFullYear()}${pad(tomorrow.getMonth() + 1)}${pad(tomorrow.getDate())}${pad(tomorrow.getHours())}${pad(tomorrow.getMinutes())}${pad(tomorrow.getSeconds())}`;


    const orderId = order.orderId;

    // Bắt buộc phải là string cho tất cả giá trị
    const vnp_Params: Record<string, string> = {
      vnp_Version: '2.1.0',
      vnp_Command: 'pay',
      vnp_TmnCode: vnp_TmnCode,
      vnp_Amount: Math.round(order.amount * 100).toString(),
      vnp_CurrCode: 'VND',
      vnp_TxnRef: orderId,
      vnp_OrderInfo: `Thanh toan don hang ${orderId}`,
      vnp_OrderType: 'topup',
      vnp_Locale: 'vn',
      vnp_ReturnUrl: vnp_ReturnUrl,
      vnp_IpAddr: clientIp,
      vnp_CreateDate: createDate,
      vnp_ExpireDate: expireDate,
    };

    // Nếu có bankCode thì thêm vào
    if (order.bankCode) {
      vnp_Params['vnp_BankCode'] = order.bankCode;
    }

     // Sắp xếp tham số đúng A-Z
    const sortedParams: Record<string, string> = Object.keys(vnp_Params)
      .sort()
      .reduce((acc, key) => {
        acc[key] = vnp_Params[key];
        return acc;
      }, {});

    // Tạo chuỗi ký KHÔNG encode
    const signData = Object.entries(sortedParams)
      .map(([key, val]) => `${key}=${val}`)
      .join('&');

    console.log('SignData:', signData); // 🔎 Kiểm tra chuỗi trước khi ký

    // Ký SHA512
    const hmac = crypto.createHmac('sha512', vnp_HashSecret);
    const signed = hmac.update(signData, 'utf-8').digest('hex');

    console.log('Signed Hash:', signed); // 🔎 Kiểm tra hash đã tạo

    // Thêm chữ ký vào tham số
    sortedParams['vnp_SecureHash'] = signed;
    sortedParams['vnp_SecureHashType'] = 'SHA512';

    // Tạo URL (có encode)
    const paymentUrl = `${vnp_Url}?` + qs.stringify(sortedParams, { encode: true });

    console.log('Final Payment URL:', paymentUrl); // 🔎 Kiểm tra URL cuối cùng

    return paymentUrl;

  }
}
