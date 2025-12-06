import { Body, Controller, Post, Get, Patch, Param, NotFoundException, UseGuards, Request } from "@nestjs/common";
import { OrderService } from "./order.service";
import { BooksService } from "src/books/books.service";
import { UpdateStatusDto } from "./update-status.dto";
import { JwtAuthGuard } from "src/users/auth/jwt.auth.guard";

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
    if (!order) throw new NotFoundException('Đơn hàng không tồn tại!');

    // Cập nhật tồn kho
    for (const item of order.products) {
      const bookId =
        typeof item.book === 'object' && (item.book as any)._id
          ? (item.book as any)._id.toString()
          : item.book.toString();

      await this.booksService.updateStock(bookId, item.quantity);
    }

    await this.orderService.updateStatus(orderId, { status: 'processing' });

    return { message: 'Thanh toán thành công, đơn hàng chuyển sang chờ xử lý!' };
  }
  
  @Patch(':id/status')
  async updateStatus(
    @Param('id') id: string,
    @Body() updateStatusDto: UpdateStatusDto
  ) {
    const updated = await this.orderService.updateStatus(id, updateStatusDto);
    return { message: 'Cập nhật trạng thái thành công', order: updated };
  }

  @UseGuards(JwtAuthGuard)
  @Patch(':id/cancel')
  async cancelOrder(@Param('id') orderId: string, @Request() req) {
    const userId = req.user._id;
    return this.orderService.cancelOrder(orderId, userId);
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  getMyOrders(@Request() req) {
    return this.orderService.findOrdersByUserId(req.user._id);
  }

  @Get('admin/backfill-products-book')
  async backfill() {
    const modified = await this.orderService.backfillProductsBook();
    return { modified };
  }
}