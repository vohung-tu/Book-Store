import { Body, Controller, Post, Get, Patch, Param, NotFoundException, UseGuards, Request, Query } from "@nestjs/common";
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

  @Get('admin/lazy')
  async getOrdersLazy(
    @Query('page') page = 1,
    @Query('limit') limit = 10,
    @Query('search') search = '',
  ) {
    return this.orderService.findAllLazy({
      page: Number(page),
      limit: Number(limit),
      search,
    });
  }

  @Get('by-code/:orderCode')
  async getByCode(@Param('orderCode') orderCode: string) {
    return this.orderService.getOrderByCode(orderCode);
  }
  
  @Post('payos/webhook')
  async handlePayOSWebhook(@Body() payload: any) {
    await this.orderService.handlePayOSWebhook(payload);
    return { received: true };
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