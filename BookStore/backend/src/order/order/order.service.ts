import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Order, OrderDocument } from './order.schema';
import { EmailService } from './email.service';

@Injectable()
export class OrderService {
  constructor(
    @InjectModel(Order.name) private orderModel: Model<OrderDocument>,
    private emailService: EmailService
  ) {}

  async createOrder(orderData: any): Promise<Order> {
    const newOrder = new this.orderModel(orderData);
    const savedOrder = await newOrder.save();

    // Gửi email hóa đơn sau khi lưu đơn hàng
    await this.emailService.sendInvoice(savedOrder.email, savedOrder);
    
    return savedOrder;
  }
}
  