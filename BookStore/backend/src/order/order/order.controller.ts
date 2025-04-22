import { Body, Controller, Post, Get } from "@nestjs/common";
import { OrderService } from "./order.service";

@Controller('orders')
export class OrderController {
  constructor(
    private orderService: OrderService
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
}