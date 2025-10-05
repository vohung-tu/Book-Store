import { BadRequestException, ForbiddenException, Injectable, InternalServerErrorException, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Order, OrderProduct } from './order.schema';
import { BooksService } from 'src/books/books.service';
import { UpdateStatusDto } from './update-status.dto';

@Injectable()
export class OrderService {
  constructor(
    @InjectModel(Order.name) private orderModel: Model<Order>,
    private booksService: BooksService 
  ) {}

  async create(createOrderDto: any): Promise<Order> {
    try {
      if (!Array.isArray(createOrderDto.products)) {
        throw new BadRequestException('Danh sách sản phẩm không hợp lệ!');
      }

      // Chuẩn hóa products
      const products = createOrderDto.products.map((item: any) => {
        const bookId = item.book || item._id; // chấp nhận cả book hoặc _id
        if (!bookId) {
          throw new BadRequestException('Sách không có ID hợp lệ!');
        }

        return {
          book: new Types.ObjectId(bookId), // ✅ đảm bảo có field book
          title: item.title,
          price: item.price,
          quantity: item.quantity,
          coverImage: item.coverImage,
        };
      });

      // Cập nhật tồn kho
      for (const p of products) {
        await this.booksService.updateStock(p.book.toString(), p.quantity);
      }

      // Tạo order
      const newOrder = new this.orderModel({
        ...createOrderDto,
        products, // ✅ thay products đã chuẩn hóa
        orderDate: new Date(),
      });

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
    const order = await this.orderModel
      .findById(orderId)
      .populate('products.book')
      .exec();
    if (!order) {
      throw new NotFoundException(`Đơn hàng với ID ${orderId} không tồn tại!`);
    }
    return order;
  }

  async updateStatus(orderId: string, updateStatusDto: UpdateStatusDto): Promise<Order> {
    const order = await this.orderModel.findById(orderId);
    if (!order) throw new NotFoundException('Order not found');

    // Nếu trạng thái mới là "completed" → cập nhật tồn kho
    if (updateStatusDto.status === 'completed') {
      for (const item of order.products as any[]) {
        const bookId =
          typeof item.book === 'object'
            ? (item.book as any)?._id?.toString?.()
            : (item.book as unknown as Types.ObjectId)?.toString?.();

        if (!bookId) {
          console.warn('⚠️ Không tìm thấy bookId cho item:', item);
          continue;
        }

        await this.booksService.updateStock(bookId, item.quantity);
      }
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
