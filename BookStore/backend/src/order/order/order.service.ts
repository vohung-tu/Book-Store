import { BadRequestException, ForbiddenException, Injectable, InternalServerErrorException, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Order, OrderDocument } from './order.schema';
import { BooksService } from 'src/books/books.service';
import { UpdateStatusDto } from './update-status.dto';
import { LoyaltyService } from 'src/loyalty/loyalty.service';
import { InventoryService } from 'src/inventory/inventory.service';
import { NotificationService } from 'src/notification/notification.service';
import { PayOSService } from 'src/payos/payos.service';

@Injectable()
export class OrderService {
  constructor(
    @InjectModel(Order.name) private orderModel: Model<OrderDocument>,
    private readonly loyaltyService: LoyaltyService,
    private readonly booksService: BooksService,
    private readonly inventoryService: InventoryService,
    private readonly notificationService: NotificationService,

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

    const paymentMethod =
      createOrderDto.paymentMethod ?? createOrderDto.payment;

    const preparedProducts = createOrderDto.products.map(
      (p: any, index: number) => {

        // ✅ LẤY BOOK ID AN TOÀN
        const bookId =
          typeof p.book === 'object' && p.book?._id
            ? p.book._id
            : p.book || p.bookId || p._id || p.id;

        if (!bookId) {
          throw new BadRequestException(
            `Thiếu ID sách trong sản phẩm (index ${index})`
          );
        }

        return {
          book: new Types.ObjectId(bookId),
          title: p.title,
          price: p.price,
          flashsale_price: p.flashsale_price ?? p.price,
          quantity: p.quantity ?? 1,
          coverImage: p.coverImage,
        };
      }
    );

    const code = 'DH' + Date.now();

    const newOrder = new this.orderModel({
      ...createOrderDto,
      products: preparedProducts,
      code,
      status: paymentMethod === 'payos' ? 'pending' : 'processing',
    });

    const saved = await newOrder.save();

    if (paymentMethod !== 'payos') {
      await this.notificationService.create({
        userId: saved.userId.toString(),
        type: 'order_created',
        title: 'Đặt hàng thành công',
        message: `Đơn hàng ${saved.code} đã được tạo.`,
      });
    }

    return saved;
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

  async findById(orderId: string): Promise<OrderDocument | null> {
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
    const newStatus = dto.status;

    // Xử lý tồn kho & loyalty
    if (newStatus === 'completed') {
      for (const item of order.products) {
        const bookId =
          typeof item.book === 'object' && (item.book as any)._id
            ? (item.book as any)._id.toString()
            : item.book.toString();

        await this.booksService.updateStock(bookId, item.quantity);

        const storeBranchId = (order as any).storeBranchId;
        if (storeBranchId) {
          await this.inventoryService.decreaseStoreStock(
            bookId,
            storeBranchId,
            item.quantity
          );
        }
      }

      if (!order.loyaltyApplied) {
        await this.loyaltyService.updateLoyaltyAfterOrder(order.userId, order.total);
      }
    }

    // Update trạng thái *không validate* → không lỗi thiếu code
    return this.orderModel.findByIdAndUpdate(
      orderId,
      { status: newStatus },
      { new: true }
    );
  }

  
  async cancelOrder(orderId: string, userId: string) {
    const order = await this.orderModel.findById(orderId);

    if (!order) throw new NotFoundException('Đơn hàng không tồn tại');
    if (order.userId.toString() !== userId.toString()) {
      throw new ForbiddenException('Bạn không có quyền hủy đơn hàng này');
    }
    if (order.status === 'cancelled') {
      throw new ForbiddenException('Đơn hàng đã bị hủy');
    }

    // ❌ Không dùng order.save() → gây validate lỗi
    const updatedOrder = await this.orderModel.findByIdAndUpdate(
      orderId,
      { status: 'cancelled' },
      { new: true }
    );

    // 🔔 tạo thông báo
    await this.notificationService.create({
      userId,
      type: 'order_cancelled',
      title: 'Đơn hàng đã bị hủy',
      message: `Đơn hàng ${order.code ?? order._id} đã bị hủy.`,
      meta: {
        orderId: order._id.toString(),
        code: order.code ?? order._id.toString(),
        status: 'cancelled',
      },
    });

    return updatedOrder;
  }

  async findOrdersByUserId(userId: string) {
    return this.orderModel.find({ userId }).sort({ createdAt: -1 }).lean();
  }

  async updateStatusByTxnRef(txnRef: string, status: string) {
    const order = await this.orderModel.findOne({ txnRef });
    if (!order) throw new NotFoundException(`Không tìm thấy order với txnRef ${txnRef}`);

    const prev = order.status;

    if (status === 'completed' && !order.loyaltyApplied) {
      await this.loyaltyService.updateLoyaltyAfterOrder(
        order.userId,
        order.total,
      );
    }

    return this.orderModel.findByIdAndUpdate(order._id, { status }, { new: true });
  }

  async createOrderFromPayOS(payosData: any) {
    const orderCode = payosData.orderCode;

    // Tránh tạo trùng đơn
    const existed = await this.orderModel.findOne({ payosOrderCode: orderCode });
    if (existed) {
      console.log("⚠ Đã tồn tại đơn PayOS:", orderCode);
      return existed;
    }

    const newOrder = new this.orderModel({
      userId: payosData.extraData?.userId ?? null,
      products: payosData.items.map((item) => ({
        book: item.productId,
        title: item.name,
        quantity: item.quantity,
        price: item.price,
      })),
      total: payosData.amount,
      paymentMethod: "payos",
      paymentStatus: "paid",
      status: "processing",
      payosOrderCode: orderCode,
    });

    const saved = await newOrder.save();

    await this.notificationService.create({
      userId: saved.userId.toString(),
      type: 'order_created',
      title: 'Thanh toán thành công',
      message: `Đơn hàng ${saved.code ?? saved._id} đã thanh toán thành công.`,
    });

    console.log("Đã tạo đơn hàng PayOS:", saved._id);
    return saved;
  }

  async getOrderByCode(orderCode: string) {
    return this.orderModel.findOne({ orderCode });
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

  async updateOrderStatus(orderId: string, status: string) {
    const order = await this.orderModel.findById(orderId);
    if (!order) throw new NotFoundException('Order not found');

    await this.orderModel.findByIdAndUpdate(orderId, { status });

    const userId = order.userId.toString();

    let type = '';
    let title = '';
    let message = '';

    switch (status) {
      case 'shipping':
        type = 'order_shipping';
        title = 'Đơn hàng đang được giao';
        message = `Đơn hàng ${order.code ?? order._id} đang được giao đến bạn.`;
        break;

      case 'delivered':
        type = 'order_delivered';
        title = 'Đơn hàng đã giao thành công';
        message = `Đơn hàng ${order.code ?? order._id} đã giao thành công.`;
        break;

      case 'cancelled':
        type = 'order_cancelled';
        title = 'Đơn hàng đã bị hủy';
        message = `Đơn hàng ${order.code ?? order._id} đã bị hủy.`;
        break;
    }

    if (type) {
      await this.notificationService.create({
        userId,
        type,
        title,
        message,
        meta: {
          orderId: order._id.toString(),
          code: order.code ?? order._id.toString(),
          status,
        },
      });
    }

    return this.orderModel.findById(orderId).lean();
  }

}
