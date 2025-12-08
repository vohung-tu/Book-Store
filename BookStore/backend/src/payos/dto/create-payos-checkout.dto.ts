export class PayOSItemDto {
  name: string;
  quantity: number;
  price: number;
}

export class CreatePayOSCheckoutDto {
  // tổng tiền thanh toán (đã gồm ship, đã trừ giảm giá nếu có)
  amount: number;

  // dữ liệu đơn hàng để BE tạo Order (khuyến nghị gửi lên)
  customer: {
    name: string;
    email: string;
    phone: string;
    address: string;
    note?: string;
  };

  items: PayOSItemDto[];
}
