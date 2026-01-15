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
import { Book, BookDocument } from 'src/books/book.schema';

@Injectable()
export class OrderService {
  constructor(
    @InjectModel(Order.name) private orderModel: Model<OrderDocument>,
    @InjectModel(Book.name) private bookModel: Model<BookDocument>,
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

  async findAllLazy(params: {
    page: number;
    limit: number;
    search?: string;
  }) {
    const { page, limit, search } = params;

    const skip = (page - 1) * limit;

    const filter: any = {};

    if (search) {
      filter.$or = [
        { code: { $regex: search, $options: 'i' } },
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { phone: { $regex: search, $options: 'i' } },
      ];
    }

    const [orders, total] = await Promise.all([
      this.orderModel
        .find(filter)
        .populate('storeBranchId', 'name city region')
        .populate({
          path: 'products.book',
          select: 'category',
          populate: {
            path: 'category',
            select: 'name',
          },
        })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),

      this.orderModel.countDocuments(filter),
    ]);

    const data = orders.map(order => ({
      ...order,
      storeBranch: order.storeBranchId || null,
      products: order.products.map(prod => ({
        ...prod,
        categoryName: (prod.book as any)?.category?.name ?? 'Khác',
      })),
    }));

    return {
      data,
      total,
      page,
      limit,
    };
  }


  async create(createOrderDto: any) {
    if (!Array.isArray(createOrderDto.products)) {
      throw new BadRequestException('Danh sách sản phẩm không hợp lệ!');
    }

    const paymentMethod =
      createOrderDto.paymentMethod ?? createOrderDto.payment;

    const preparedProducts = await Promise.all(
      createOrderDto.products.map(async (p: any, index: number) => {

        const bookId =
          typeof p.book === 'object' && p.book?._id
            ? p.book._id
            : p.book || p.bookId || p._id || p.id;

        if (!bookId) {
          throw new BadRequestException(
            `Thiếu ID sách trong sản phẩm (index ${index})`
          );
        }

        const book = await this.bookModel
          .findById(bookId)
          .populate('category', 'name slug parentId')
          .lean();

        if (!book) {
          throw new BadRequestException(
            `Sách không tồn tại hoặc đã bị xóa (bookId: ${bookId})`
          );
        }

        return {
          book: new Types.ObjectId(bookId),
          title: book.title,
          price: p.price,
          quantity: p.quantity ?? 1,
          flashsale_price: book.flashsale_price || 0,
          categoryId: (book as any).category?._id ?? null,
          categoryName: (book as any).category?.name ?? 'Khác',
          parentCategoryId: (book as any).category?.parentId ?? null,
        };
      })
    );

    const code = 'DH' + Date.now();

    const newOrder = new this.orderModel({
      ...createOrderDto,
      products: preparedProducts,
      code,
      status: paymentMethod === 'payos'
        ? 'pending_payment'
        : 'processing',
      paymentStatus: paymentMethod === 'payos'
        ? 'unpaid'
        : 'unpaid',
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
      .populate({
        path: 'products.book',
        select: 'category',
        populate: {
          path: 'category',
          select: 'name'
        }
      })
      .sort({ createdAt: -1 })
      .lean();

    return orders.map(order => ({
      ...order,
      storeBranch: order.storeBranchId || null,
      products: order.products.map(prod => ({
        ...prod,
        categoryName: (prod.book as any)?.category?.name ?? 'Khác'
      }))
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

  async markOrderPaidByPayOS(data: any) {
    const order = await this.orderModel.findOne({
      payosOrderCode: data.orderCode,
    });

    if (!order) {
      console.warn("❌ Không tìm thấy order PayOS:", data.orderCode);
      return;
    }

    // ✅ Chống webhook gọi nhiều lần
    if (order.paymentStatus === 'paid') {
      return;
    }

    order.paymentStatus = 'paid';
    order.status = 'processing';
    await order.save();

    // 🔔 TẠO NOTIFICATION TẠI ĐÂY (DUY NHẤT)
    await this.notificationService.create({
      userId: order.userId.toString(),
      type: 'order_paid',
      title: 'Thanh toán thành công',
      message: `Đơn hàng ${order.code} đã được thanh toán thành công.`,
      meta: {
        orderId: order._id.toString(),
        code: order.code,
        status: order.status,
      },
    });
  }

  async markOrderFailedByPayOS(payosData: any) {
    const order = await this.orderModel.findOne({
      payosOrderCode: payosData.orderCode,
    });

    if (!order) return null;

    // ⛔ chống webhook gọi trùng
    if (order.paymentStatus !== 'unpaid') return order;

    order.paymentStatus = 'failed';
    order.status = 'payment_failed';
    await order.save();

    await this.notificationService.create({
      userId: order.userId.toString(),
      type: 'order_payment_failed',
      title: 'Thanh toán thất bại',
      message: `Giao dịch đơn hàng ${order.code} đã bị hủy hoặc không thành công.`,
      meta: {
        orderId: order._id.toString(),
        code: order.code,
        status: 'payment_failed',
      },
    });

    return order;
  }

  async handlePayOSWebhook(payload: any) {
    if (payload.status !== 'PAID') return;

    const order = await this.orderModel.findOne({
      payosOrderCode: payload.orderCode,
    });

    if (!order) return;

    if (order.paymentStatus === 'paid') return;

    order.status = 'processing';
    order.paymentStatus = 'paid';
    await order.save();

    await this.notificationService.create({
      userId: order.userId.toString(),
      type: 'order_paid',
      title: 'Thanh toán thành công',
      message: `Đơn hàng ${order.code} đã được thanh toán thành công.`,
      meta: {
        orderId: order._id.toString(),
        code: order.code,
        status: order.status,
      },
    });
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
