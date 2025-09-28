import { BadRequestException, ForbiddenException, Injectable, InternalServerErrorException, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Order } from './order.schema';
import { BooksService } from 'src/books/books.service';
import { UpdateStatusDto } from './update-status.dto';

@Injectable()
export class OrderService {
  constructor(
    @InjectModel(Order.name) private orderModel: Model<Order>,
    private booksService: BooksService // ✅ Inject BooksService để cập nhật tồn kho
  ) {}

  async create(createOrderDto: any): Promise<Order> {
    try {
      console.log('createOrderDto:', createOrderDto);
      if (!Array.isArray(createOrderDto.products)) {
        throw new BadRequestException('Danh sách sản phẩm không hợp lệ!');
      }

      // 🔽 Giảm số lượng tồn kho cho từng sản phẩm trong đơn hàng
      for (const item of createOrderDto.products) {
        console.log('Book ID:', item._id); // ✅ Kiểm tra dữ liệu

        if (!item._id) {
          throw new BadRequestException('Sách không có ID hợp lệ!');
        }
        await this.booksService.updateStock(item._id, item.quantity);
      }

      const newOrder = new this.orderModel(createOrderDto);
      return await newOrder.save();
    } catch (error) {
      console.error('Create Order Error:', error);
      throw new InternalServerErrorException('Failed to create order');
    }
  }

  async findAll(): Promise<any[]> {
    const orders = await this.orderModel.find().sort({ createdAt: -1 }).lean();

    // Lấy danh sách sách (dạng phân trang)
    const allBooks = await this.booksService.findAllBooks();
    const bookItems = allBooks.items ?? [];

    return orders.map(order => ({
      ...order,
      products: order.products.map(prod => {
        const productId = (prod as any)._id?.toString?.();
        const book = bookItems.find(b => b._id.toString() === productId);
        return {
          ...prod,
          categoryName: book?.categoryName ?? { name: 'Khác' }
        };
      })
    }));
  }

  async findById(orderId: string): Promise<Order | null> {
    const order = await this.orderModel.findById(orderId).exec();
    if (!order) {
      throw new NotFoundException(`Đơn hàng với ID ${orderId} không tồn tại!`);
    }
    return order;
  }

  async updateStatus(orderId: string, updateStatusDto: UpdateStatusDto): Promise<Order> {
    const order = await this.orderModel.findById(orderId);
    if (!order) {
      throw new NotFoundException('Order not found');
    }

    order.status = updateStatusDto.status;
    return order.save();
  }

  async cancelOrder(orderId: string, userId: string): Promise<Order> {
    const order = await this.orderModel.findById(orderId);
    
    if (!order) {
      throw new NotFoundException('Đơn hàng không tồn tại');
    }

    if (order.userId.toString() !== userId.toString()) {
      throw new ForbiddenException('Bạn không có quyền hủy đơn hàng này');
    }

    if (order.status === 'cancelled') {
      throw new ForbiddenException('Đơn hàng đã bị hủy');
    }

    order.status = 'cancelled';
    return await order.save();
  }

  async findOrdersByUserId(userId: string) {
    return this.orderModel.find({ user: userId }).sort({ createdAt: -1 }).lean();
  }

  async updateStatusByTxnRef(txnRef: string, status: string) {
    const order = await this.orderModel.findOne({ txnRef });
    if (!order) throw new NotFoundException(`Không tìm thấy order với txnRef ${txnRef}`);
    order.status = status;
    return order.save();
  }
}
