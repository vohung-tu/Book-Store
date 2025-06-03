import { Body, Controller, Post, Get, Patch, Param, NotFoundException } from "@nestjs/common";
import { OrderService } from "./order.service";
import { BooksService } from "src/books/books.service";
import { UpdateStatusDto } from "./update-status.dto";

@Controller('orders')
export class OrderController {
  constructor(
    private orderService: OrderService,
    private booksService: BooksService
  ) {}

  @Post()
  async createOrder(@Body() orderData: any) {
    const order = await this.orderService.create(orderData);
    return order;
  }

  @Get()
  async getAllOrders() {
    return this.orderService.findAll(); // gọi tới service
  }

  @Patch(':orderId/confirm-payment')
  async confirmPayment(@Param('orderId') orderId: string) {
    const order = await this.orderService.findById(orderId);
    if (!order) {
      throw new NotFoundException('Đơn hàng không tồn tại!');
    }

    // 🔽 Cập nhật số lượng tồn kho cho từng sách trong đơn hàng
    for (const item of order.products) {
      await this.booksService.updateStock(item.bookId, item.quantity);
    }

    return { message: 'Thanh toán thành công, đã cập nhật tồn kho!' };
  }
  
  @Patch(':id/status')
  async updateStatus(@Param('id') id: string, @Body() updateStatusDto: UpdateStatusDto) {
    return this.orderService.updateStatus(id, updateStatusDto);
  }
}