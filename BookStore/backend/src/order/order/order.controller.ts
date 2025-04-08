import { Body, Controller, Post } from "@nestjs/common";
import { EmailService } from "./email.service";
import { OrderService } from "./order.service";

@Controller('orders')
export class OrderController {
    constructor(
      private emailService: EmailService,
      private orderService: OrderService) {}

    @Post()
    async createOrder(@Body() orderData: any) {
      //xử lý đơn hàng (lưu vào DB nếu cần)
      const order = await this.orderService.create(orderData);
      
      //Gửi email hóa đơn
      await this.emailService.sendInvoice(orderData.email, orderData);
      return { message: 'Đơn hàng đã đặt thành công!', order };
      // return order;
  }
}