import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Order } from './order.schema';
import { EmailService } from './email.service';

@Injectable()
export class OrderService {
  constructor(
    @InjectModel(Order.name) private orderModel: Model<Order>,
    private emailService: EmailService
  ) {}

  // async createOrder(orderData: any): Promise<Order> {
  //   const newOrder = new this.orderModel(orderData);
  //   const savedOrder = await newOrder.save();

  //   // Gửi email hóa đơn sau khi lưu đơn hàng
  //   await this.emailService.sendInvoice(savedOrder.email, savedOrder);
    
  //   return savedOrder;
  // }

  async create(createOrderDto: any): Promise<Order> {
    try {
      console.log('createOrderDto:', createOrderDto); // 👈 Debug log
      const newOrder = new this.orderModel(createOrderDto);
      return await newOrder.save();
    } catch (error) {
      console.error('Create Order Error:', error); // 👈 Xem log lỗi
      throw new InternalServerErrorException('Failed to create order');
    }
  }
}
  