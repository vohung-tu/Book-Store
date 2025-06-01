import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Order } from './order.schema';

@Injectable()
export class OrderService {
  constructor(
    @InjectModel(Order.name) private orderModel: Model<Order>
  ) {}

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
  async findAll(): Promise<Order[]> {
    return this.orderModel.find().sort({ createdAt: -1 }).exec();
  }
}
  