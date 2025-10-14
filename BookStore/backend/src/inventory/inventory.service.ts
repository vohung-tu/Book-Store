import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectConnection, InjectModel } from '@nestjs/mongoose';
import { Model, Connection, Types, Document } from 'mongoose';
import { InventoryReceipt } from './schemas/inventory-receipt.schema';
import { InventoryReceiptDetail } from './schemas/inventory-receipt-detail.schema';
import { CreateImportDto } from './dto/create-import.dto';
import { CreateExportDto } from './dto/create-export.dto';
import { Book } from 'src/books/book.schema';

@Injectable()
export class InventoryService {
  constructor(
    @InjectModel(InventoryReceipt.name)
    private readonly receiptModel: Model<InventoryReceipt & Document>,

    @InjectModel(InventoryReceiptDetail.name)
    private readonly detailModel: Model<InventoryReceiptDetail & Document>,

    @InjectModel(Book.name)
    private readonly bookModel: Model<Book & Document>,

    @InjectConnection()
    private readonly connection: Connection,
  ) {}

  private async generateCode(prefix: 'NK' | 'XK', date: Date, session: any): Promise<string> {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    const base = `${prefix}${y}${m}${d}`;
    const regex = new RegExp(`^${base}-\\d{3}$`);
    const count = await this.receiptModel.countDocuments({ code: { $regex: regex } }).session(session);
    return `${base}-${String(count + 1).padStart(3, '0')}`;
  }

  // =====================================
  // 📥 TẠO PHIẾU NHẬP KHO
  // =====================================
  async createImport(dto: CreateImportDto, userId: string): Promise<any> {
    if (!dto.lines?.length) throw new BadRequestException('lines is empty');

    const session = await this.connection.startSession();
    session.startTransaction();

    try {
      const date = new Date(dto.date);
      const code = await this.generateCode('NK', date, session);

      const receipt = new this.receiptModel({
        code,
        type: 'import',
        date,
        supplierName: dto.supplierName ?? '',
        reason: dto.reason ?? '',
        createdBy: new Types.ObjectId(userId),
        totalAmount: 0,
        totalQuantity: 0,
        details: [],
      });

      let totalQty = 0;
      let totalAmount = 0;
      const detailIds: Types.ObjectId[] = [];

      for (const line of dto.lines) {
        const book = await this.bookModel.findById(line.bookId).session(session);
        if (!book) throw new NotFoundException(`Book not found: ${line.bookId}`);

        // ✅ Cập nhật tồn kho
        const newStock = (book.stockQuantity ?? 0) + line.quantity;
        book.stockQuantity = newStock;
        book.quantity = newStock;
        await book.save({ session });

        const subtotal = (line.unitPrice ?? 0) * line.quantity;
        const detail = new this.detailModel({
          receiptId: receipt._id,
          bookId: book._id,
          quantity: line.quantity,
          unitPrice: line.unitPrice ?? 0,
          subtotal,
        });
        await detail.save({ session });

        detailIds.push(detail._id as Types.ObjectId);
        totalQty += line.quantity;
        totalAmount += subtotal;
      }

      // ✅ Lưu receipt và chi tiết
      receipt.totalQuantity = totalQty;
      receipt.totalAmount = totalAmount;
      receipt.details = detailIds;
      await receipt.save({ session });

      await session.commitTransaction();

      // ✅ Populate ngay sau khi commit
      return await this.receiptModel
        .findById(receipt._id)
        .populate({
          path: 'details',
          populate: { path: 'bookId', select: 'title stockQuantity quantity' },
        })
        .lean();
    } catch (e) {
      await session.abortTransaction();
      throw e;
    } finally {
      session.endSession();
    }
  }

  // =====================================
  // 📤 TẠO PHIẾU XUẤT KHO
  // =====================================
  async createExport(dto: CreateExportDto, userId: string): Promise<any> {
    if (!dto.lines?.length) throw new BadRequestException('lines is empty');

    const session = await this.connection.startSession();
    session.startTransaction();

    try {
      const date = new Date(dto.date);
      const code = await this.generateCode('XK', date, session);

      const receipt = new this.receiptModel({
        code,
        type: 'export',
        date,
        receiverName: dto.receiverName ?? '',
        reason: dto.reason ?? '',
        createdBy: new Types.ObjectId(userId),
        totalAmount: 0,
        totalQuantity: 0,
        details: [],
      });

      let totalQty = 0;
      let totalAmount = 0;
      const detailIds: Types.ObjectId[] = [];

      // ✅ Kiểm tra tồn kho trước
      for (const line of dto.lines) {
        const book = await this.bookModel.findById(line.bookId).session(session);
        if (!book) throw new NotFoundException(`Book not found: ${line.bookId}`);
        if ((book.stockQuantity ?? 0) < line.quantity) {
          throw new BadRequestException(`Not enough stock for book ${book.title}`);
        }
      }

      // ✅ Giảm tồn và tạo chi tiết
      for (const line of dto.lines) {
        const book = await this.bookModel.findById(line.bookId).session(session);
        if (!book) throw new NotFoundException(`Book not found: ${line.bookId}`);

        const newStock = (book.stockQuantity ?? 0) - line.quantity;
        book.stockQuantity = newStock;
        book.quantity = newStock;
        await book.save({ session });

        const subtotal = (line.unitPrice ?? 0) * line.quantity;
        const detail = new this.detailModel({
          receiptId: receipt._id,
          bookId: book._id,
          quantity: line.quantity,
          unitPrice: line.unitPrice ?? 0,
          subtotal,
        });
        await detail.save({ session });

        detailIds.push(detail._id as Types.ObjectId);
        totalQty += line.quantity;
        totalAmount += subtotal;
      }

      // ✅ Lưu receipt và chi tiết
      receipt.totalQuantity = totalQty;
      receipt.totalAmount = totalAmount;
      receipt.details = detailIds;
      await receipt.save({ session });

      await session.commitTransaction();

      return await this.receiptModel
        .findById(receipt._id)
        .populate({
          path: 'details',
          populate: { path: 'bookId', select: 'title stockQuantity quantity' },
        })
        .lean();
    } catch (e) {
      await session.abortTransaction();
      throw e;
    } finally {
      session.endSession();
    }
  }

  // =====================================
  // 📋 DANH SÁCH PHIẾU XUẤT / NHẬP
  // =====================================
  async listReceipts(query: {
    type?: 'import' | 'export';
    from?: string;
    to?: string;
    q?: string;
    page?: number;
    limit?: number;
  }): Promise<{ items: any[]; total: number; page: number; limit: number; pages: number }> {
    const filter: any = {};
    if (query.type) filter.type = query.type;

    if (query.from || query.to) {
      filter.date = {};
      if (query.from) filter.date.$gte = new Date(query.from);
      if (query.to) filter.date.$lte = new Date(query.to);
    }

    if (query.q) {
      const regex = new RegExp(query.q, 'i');
      filter.$or = [
        { code: regex },
        { supplierName: regex },
        { receiverName: regex },
        { reason: regex },
      ];
    }

    const page = Math.max(1, Number(query.page) || 1);
    const limit = Math.min(100, Math.max(1, Number(query.limit) || 20));

    const [items, total] = await Promise.all([
      this.receiptModel
        .find(filter)
        .sort({ date: -1, createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .populate({
          path: 'details',
          populate: { path: 'bookId', select: 'title' },
        })
        .lean(),
      this.receiptModel.countDocuments(filter),
    ]);

    return { items, total, page, limit, pages: Math.ceil(total / limit) };
  }

  // =====================================
  // 🔍 XEM CHI TIẾT PHIẾU
  // =====================================
  async getOne(id: string): Promise<any> {
    const item = await this.receiptModel
      .findById(id)
      .populate({
        path: 'details',
        model: this.detailModel.modelName,              // 👈 ép dùng đúng model
        populate: {
          path: 'bookId',
          model: this.bookModel.modelName,              // 👈 ép đúng model
          select: 'title stockQuantity quantity',
        },
      })
      .lean();

    if (!item) throw new NotFoundException('Receipt not found');
    return item;
  }

  // =====================================
  // 📚 LẤY TẤT CẢ PHIẾU (cho admin)
  // =====================================
  async findAll(): Promise<any[]> {
    return this.receiptModel
      .find()
      .sort({ date: -1 })
      .populate({
        path: 'details',
        model: this.detailModel.modelName,
        populate: {
          path: 'bookId',
          model: this.bookModel.modelName,
          select: 'title stockQuantity quantity',
        },
      })
      .lean();
  }
}
