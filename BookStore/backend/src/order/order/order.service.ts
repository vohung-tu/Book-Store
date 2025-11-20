import { BadRequestException, ForbiddenException, Injectable, InternalServerErrorException, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Order, OrderProduct } from './order.schema';
import { BooksService } from 'src/books/books.service';
import { UpdateStatusDto } from './update-status.dto';
import { LoyaltyService } from 'src/loyalty/loyalty.service';
import { InventoryService } from 'src/inventory/inventory.service';

@Injectable()
export class OrderService {
  constructor(
    @InjectModel(Order.name) private orderModel: Model<Order>,
    private readonly loyaltyService: LoyaltyService,
    private readonly booksService: BooksService,
    private readonly inventoryService: InventoryService,
  ) {}

  async backfillProductsBook(): Promise<number> {
  // Dùng aggregation pipeline để map lại mảng products
    const res = await this.orderModel.updateMany(
      { 'products.book': { $exists: false }, 'products._id': { $exists: true } },
      [
        {
          $set: {
            products: {
              $map: {
                input: '$products',
                as: 'p',
                in: {
                  $mergeObjects: [
                    '$$p',
                    { book: { $ifNull: ['$$p.book', '$$p._id'] } } // nếu chưa có book thì lấy _id cũ
                  ]
                }
              }
            }
          }
        }
      ]
    );
    return (res as any).modifiedCount ?? 0;
  }

  async create(createOrderDto: any) {
    if (!Array.isArray(createOrderDto.products)) {
      throw new BadRequestException('Danh sách sản phẩm không hợp lệ!');
    }

    const preparedProducts = createOrderDto.products.map((p: any) => {
      const bookId = p.book || p._id || p.id || p.bookId;
      if (!bookId) throw new BadRequestException('Thiếu ID sách trong sản phẩm!');
      return {
        book: new Types.ObjectId(bookId),
        title: p.title,
        price: p.price,
        flashsale_price: p.flashsale_price ?? p.price,
        quantity: p.quantity,
        coverImage: p.coverImage,
      };
    });

    const newOrder = new this.orderModel({
      ...createOrderDto,
      products: preparedProducts,
    });

    return await newOrder.save();
  }


  async findAll(): Promise<any[]> {
    const orders = await this.orderModel
    .find()
    .populate('storeBranchId', 'name city region')
    .sort({ createdAt: -1 })
    .lean();

    // Lấy danh sách sách (dạng phân trang)
    const allBooks = await this.booksService.findAllBooks();
    const bookItems = allBooks.items ?? [];

    return orders.map(order => ({
      ...order,
      storeBranch: order.storeBranchId || null,
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

  async updateStatus(orderId: string, dto: UpdateStatusDto) {
    const order = await this.orderModel.findById(orderId);
    if (!order) throw new NotFoundException('Order not found');

    const prev = order.status;
    order.status = dto.status;

    if (dto.status === 'completed') {
      for (const item of order.products as any[]) {
        const ref = item.book;
        const bookId = (ref && typeof ref === 'object' && ref._id) ? String(ref._id) : String(ref);
        const storeBranchId = (order as any).storeBranchId || item.storeBranchId; // 👈 đảm bảo lấy đúng id cửa hàng
        const qty = item.quantity;

        if (bookId) {
          await this.booksService.updateStock(bookId, qty); // tổng kho

          if (storeBranchId) {
            console.log('🏪 Decreasing store stock for', bookId, storeBranchId);
            await this.inventoryService.decreaseStoreStock(bookId, storeBranchId, qty);
          } else {
            console.warn('⚠️ Không có storeBranchId, bỏ qua giảm tồn cửa hàng');
          }
        }
      }
    }

    if (prev !== 'completed' && dto.status === 'completed' && !order.loyaltyApplied) {
      try {
        await this.loyaltyService.updateLoyaltyAfterOrder(order.userId, order.total as any as number);
        order.loyaltyApplied = true;
      } catch (e) {
        console.error('[LOYALTY] updateStatus failed', e);
      }
    }

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
    return this.orderModel.find({ userId }).sort({ createdAt: -1 }).lean();
  }

  async updateStatusByTxnRef(txnRef: string, status: string) {
    const order = await this.orderModel.findOne({ txnRef });
    if (!order) throw new NotFoundException(`Không tìm thấy order với txnRef ${txnRef}`);

    const prev = order.status;
    order.status = status;

    if (prev !== 'completed' && status === 'completed' && !order.loyaltyApplied) {
      try {
        await this.loyaltyService.updateLoyaltyAfterOrder(order.userId, order.total as any as number);
        order.loyaltyApplied = true;
      } catch (e) {
        console.error('[LOYALTY] updateStatusByTxnRef failed', e);
      }
    }
    return order.save();
  }

  async markOrderCompleted(orderId: string) {
    const order = await this.orderModel.findById(orderId);
    if (!order) throw new Error('Order not found');

    const prevStatus = order.status;
    order.status = 'completed';

    if (prevStatus !== 'completed' && !order.loyaltyApplied) {
      try {
        await this.loyaltyService.updateLoyaltyAfterOrder(
          (order as any).userId ?? (order as any).user,
          (order as any).total as number
        );
        order.loyaltyApplied = true;
      } catch (e) {
        console.error('[LOYALTY] apply failed in markOrderCompleted', e);
      }
    }

    await order.save();
    return order;
  }
}
