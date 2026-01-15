import { BadRequestException, Inject, Injectable, NotFoundException } from '@nestjs/common';
import { InjectConnection, InjectModel } from '@nestjs/mongoose';
import { Model, Connection, Types, Document } from 'mongoose';
import { InventoryReceipt } from './schemas/inventory-receipt.schema';
import { InventoryReceiptDetail } from './schemas/inventory-receipt-detail.schema';
import { CreateImportDto } from './dto/create-import.dto';
import { CreateExportDto } from './dto/create-export.dto';
import { Book } from 'src/books/book.schema';
import * as XLSX from 'xlsx';
import { Branch, Inventory } from './schemas/inventory-branch.schema';
import { WarehouseAdmin } from './schemas/warehouse-admin.schema';
import { Cache } from 'cache-manager';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { StoreBranchInventory } from 'src/store-branch/schemas/store-branch-inventory.schema';

@Injectable()
export class InventoryService {
  constructor(
    @InjectModel(InventoryReceipt.name)
    private readonly receiptModel: Model<InventoryReceipt & Document>,

    @InjectModel(InventoryReceiptDetail.name)
    private readonly detailModel: Model<InventoryReceiptDetail & Document>,

    @InjectModel(Book.name)
    private readonly bookModel: Model<Book & Document>,

    @InjectModel(Inventory.name)
    private readonly inventoryModel: Model<Inventory & Document>,

    @InjectModel(WarehouseAdmin.name)
    private readonly branchModel: Model<WarehouseAdmin & Document>,
    
    @InjectModel(StoreBranchInventory.name)
    private storeInventoryModel: Model<StoreBranchInventory>,

    @InjectConnection()
    private readonly connection: Connection,

    @Inject(CACHE_MANAGER)
     private readonly cacheManager: Cache,
    
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
  async createImport(
    dto: CreateImportDto & { branchId?: string },
    userId: string,
  ): Promise<any> {
    if (!dto.lines?.length) {
      throw new BadRequestException('Danh sách sản phẩm rỗng!');
    }

    const session = await this.connection.startSession();
    session.startTransaction();

    try {
      const date = new Date(dto.date);
      const code = await this.generateCode('NK', date, session);

      // 🔍 Xác định chi nhánh nhập kho
      const branch = dto.branchId
        ? await this.branchModel.findById(dto.branchId).session(session)
        : await this.branchModel
            .findOne({ name: 'Kho Hồ Chí Minh' })
            .session(session);

      if (!branch) {
        throw new NotFoundException('Không tìm thấy chi nhánh nhập kho');
      }

      const receipt = new this.receiptModel({
        code,
        type: 'import',
        date,
        branchId: branch._id,
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
        // 🔍 Kiểm tra sách tồn tại
        const book = await this.bookModel
          .findById(line.bookId)
          .session(session);

        if (!book) {
          throw new NotFoundException(`Không tìm thấy sách: ${line.bookId}`);
        }

        // ✅ CẬP NHẬT TỒN KHO TỔNG (Book) — KHÔNG save()
        await this.bookModel.updateOne(
          { _id: book._id },
          {
            $inc: {
              stockQuantity: line.quantity,
              quantity: line.quantity,
            },
          },
          { session },
        );

        // ✅ CẬP NHẬT TỒN KHO THEO CHI NHÁNH
        await this.inventoryModel.updateOne(
          { bookId: book._id, branchId: branch._id },
          { $inc: { quantity: line.quantity } },
          { upsert: true, session },
        );

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

      receipt.totalQuantity = totalQty;
      receipt.totalAmount = totalAmount;
      receipt.details = detailIds;

      await receipt.save({ session });
      await session.commitTransaction();

      return await this.receiptModel
        .findById(receipt._id)
        .populate({
          path: 'details',
          populate: {
            path: 'bookId',
            select: 'title stockQuantity quantity',
          },
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
  async createExport(dto: CreateExportDto & { branchId?: string }, userId: string): Promise<any> {
    if (!dto.lines?.length) throw new BadRequestException('Danh sách sản phẩm rỗng!');

    const session = await this.connection.startSession();
    session.startTransaction();

    try {
      const date = new Date(dto.date);
      const code = await this.generateCode('XK', date, session);

      const branch = dto.branchId
        ? await this.branchModel.findById(dto.branchId).session(session)
        : await this.branchModel.findOne({ name: 'Kho Hồ Chí Minh' }).session(session);

      if (!branch) throw new NotFoundException('Không tìm thấy chi nhánh xuất kho');

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

      // ✅ Kiểm tra tồn kho chi nhánh
      for (const line of dto.lines) {
        const inv = await this.inventoryModel.findOne({ bookId: line.bookId, branchId: branch._id }).session(session);
        if (!inv || inv.quantity < line.quantity) {
          throw new BadRequestException(`Chi nhánh "${branch.name}" không đủ hàng cho sách ${line.bookId}`);
        }
      }

      for (const line of dto.lines) {
        const book = await this.bookModel.findById(line.bookId).session(session);
        if (!book) throw new NotFoundException(`Không tìm thấy sách: ${line.bookId}`);

        // ✅ Giảm tồn kho tổng
        const newStock = (book.stockQuantity ?? 0) - line.quantity;
        book.stockQuantity = newStock;
        book.quantity = newStock;
        await book.save({ session });

        // ✅ Giảm tồn kho chi nhánh
        await this.inventoryModel.updateOne(
          { bookId: book._id, branchId: branch._id },
          { $inc: { quantity: -line.quantity } },
          { session },
        );

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

  // chuyển kho -> cửa hàng:

  async transferToStore(dto: {
    bookId: string;
    fromBranchId: string;   
    toStoreBranchId: string;
    quantity: number;
    reason?: string;
    userId: string;
  }) {
    const { bookId, fromBranchId, toStoreBranchId, quantity, userId } = dto;
    if (!bookId || !fromBranchId || !toStoreBranchId || !quantity)
      throw new BadRequestException('Thiếu thông tin khi chuyển kho');

    const session = await this.connection.startSession();
    session.startTransaction();

    try {
      // Kiểm tra sách
      const book = await this.bookModel.findById(bookId).session(session);
      if (!book) throw new NotFoundException('Không tìm thấy sách');

      // Kiểm tra kho gốc
      const inv = await this.inventoryModel.findOne({ bookId, branchId: fromBranchId }).session(session);
      if (!inv || inv.quantity < quantity) {
        throw new BadRequestException(`Kho ${fromBranchId} không đủ hàng`);
      }

      // Giảm kho gốc
      await this.inventoryModel.updateOne(
        { bookId, branchId: fromBranchId },
        { $inc: { quantity: -quantity } },
        { session }
      );

      // Tăng tồn kho cửa hàng (storebranchinventories)
      const storeInventory = this.connection.collection('storebranchinventories');
      await storeInventory.updateOne(
        { book: new Types.ObjectId(bookId), storeBranch: new Types.ObjectId(toStoreBranchId) },
        { $inc: { quantity: quantity } },
        { upsert: true, session }
      );

      // Cập nhật tồn tổng trong bảng Book
      await this.bookModel.updateOne(
        { _id: book._id },
        { $set: { quantity: book.quantity } }, // giữ nguyên tổng
        { session }
      );

      // Ghi lại phiếu
      const code = await this.generateCode('XK', new Date(), session);
      const receipt = new this.receiptModel({
        code,
        type: 'transfer',
        date: new Date(),
        reason: dto.reason ?? 'Chuyển kho sang chi nhánh cửa hàng',
        createdBy: new Types.ObjectId(userId),
        totalQuantity: quantity,
        totalAmount: 0,
        details: [],
      });
      await receipt.save({ session });

      // Xóa cache sách
      try {
        await this.cacheManager.del(`book:${bookId}`);
        console.log(`🧹 Cache cleared after transfer: book:${bookId}`);
      } catch (err) {
        console.warn('⚠️ Không thể xóa cache sau khi chuyển kho:', err.message);
      }

      await session.commitTransaction();
      return { message: 'Chuyển kho thành công', receiptCode: code };
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
        .populate('branchId', 'name') 
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

  // =====================================
  // 📥 IMPORT DỮ LIỆU KHO TỪ FILE EXCEL
  // =====================================
  async importFromExcel(rows: any[], userId: string) {
    if (!Array.isArray(rows) || !rows.length)
      throw new BadRequestException('File Excel trống hoặc không hợp lệ');

    // Giả định Excel có các cột: Mã sách, Số lượng, Giá nhập
    const lines: { bookId: string; quantity: number; unitPrice: number }[] = [];
    for (const row of rows) {
      const code = row['Mã sách'] || row['BookCode'] || row['Code'];
      const quantity = Number(row['Số lượng'] || row['Quantity'] || 0);
      const unitPrice = Number(row['Giá nhập'] || row['ImportPrice'] || 0);

      if (!code || !quantity) continue;

      const book = await this.bookModel.findOne({ code });
      if (!book) {
        console.warn(`⚠️ Không tìm thấy sách có mã: ${code}`);
        continue;
      }

      lines.push({
        bookId: (book._id as Types.ObjectId).toString(),
        quantity,
        unitPrice,
      });
    }

    if (!lines.length)
      throw new BadRequestException('Không có dòng hợp lệ trong file Excel');

    // Dùng lại createImport() hiện có
    const dto = {
      date: new Date(),
      supplierName: 'Import Excel',
      reason: 'Nhập kho hàng loạt từ Excel',
      lines,
    };

    const receipt = await this.createImport(dto as any, userId);
    return [receipt];
  }

  // =====================================
  // 📦 XEM TỒN KHO THEO CHI NHÁNH
  // =====================================
  async getBranchStockByBook(bookId: string) {
    if (!bookId) throw new BadRequestException('Thiếu bookId');

    return this.inventoryModel.aggregate([
      // 1️⃣ Lọc đúng sách
      { $match: { bookId: new Types.ObjectId(bookId) } },

      // 2️⃣ Ép branchId về ObjectId (phòng trường hợp lưu là string)
      {
        $addFields: {
          branchIdObj: {
            $cond: {
              if: { $eq: [{ $type: "$branchId" }, "string"] },
              then: { $toObjectId: "$branchId" },
              else: "$branchId"
            }
          }
        }
      },

      // 3️⃣ Join với collection "branches" (chính xác tên collection)
      {
        $lookup: {
          from: "branches",             // ✅ đúng tên collection Mongo
          localField: "branchIdObj",
          foreignField: "_id",
          as: "branch"
        }
      },

      // 4️⃣ Lấy phần tử đầu trong mảng branch
      { $unwind: { path: "$branch", preserveNullAndEmptyArrays: true } },

      // 5️⃣ Chỉ trả về _id của branch, tên và tồn kho
      {
        $project: {
          _id: "$branch._id",           // ✅ SAI Ở ĐÂY LÚC TRƯỚC → giờ sửa lại
          name: "$branch.name",         // ✅ lấy tên chi nhánh
          region: "$branch.region",
          city: "$branch.city",
          address: "$branch.address",
          quantity: 1
        }
      }
    ]);
  }

  async getAllBranches() {
    return this.branchModel
      .find()
      .select('_id code name region address managerName managerEmail managerPhone')
      .sort({ name: 1 })
      .lean();
  }

  async decreaseBranchStock(bookId: string, branchId: string, quantity: number) {
    if (!bookId || !branchId) {
      throw new BadRequestException('Thiếu bookId hoặc branchId');
    }

    // Giảm số lượng tại chi nhánh
    const updated = await this.inventoryModel.updateOne(
      { bookId: new Types.ObjectId(bookId), branchId: new Types.ObjectId(branchId) },
      { $inc: { quantity: -quantity } }
    );

    if (updated.matchedCount === 0) {
      console.warn(`Không tìm thấy tồn kho cho book ${bookId} tại branch ${branchId}`);
    }

    // Giảm tổng tồn trong bảng Book
    await this.bookModel.updateOne(
      { _id: new Types.ObjectId(bookId) },
      { $inc: { stockQuantity: -quantity, quantity: -quantity } }
    );

    // xóa cache để FE load tồn kho mới
    try {
      await this.cacheManager.del(`book:${bookId}`);
      console.log(`Cache cleared: book:${bookId}`);
    } catch (err) {
      console.warn(`Không thể xoá cache book:${bookId}`, err.message);
    }

    return updated;
  }

  async decreaseStoreStock(bookId: string, storeBranchId: string, quantity: number) {
    console.log('🧭 decreaseStoreStock CALLED', { bookId, storeBranchId, quantity });
    if (!bookId || !storeBranchId) {
      throw new BadRequestException('Thiếu bookId hoặc storeBranchId');
    }

    const updated = await this.storeInventoryModel.updateOne(
      { book: new Types.ObjectId(bookId), storeBranch: new Types.ObjectId(storeBranchId) },
      { $inc: { quantity: -quantity } }
    );

    if (updated.matchedCount === 0) {
      console.warn(`⚠️ Không tìm thấy tồn kho cửa hàng của sách ${bookId} tại branch ${storeBranchId}`);
    }

    // Cập nhật tổng tồn trong Book
    await this.bookModel.updateOne(
      { _id: new Types.ObjectId(bookId) },
      { $inc: { stockQuantity: -quantity, quantity: -quantity } }
    );

    // Xóa cache nếu có
    if ((this as any).cacheManager) {
      await (this as any).cacheManager.del(`book:${bookId}`);
    }

    return updated;
  }


  async getStockByBranch(branchId: string) {
    return this.inventoryModel.aggregate([
      { $match: { branchId: new Types.ObjectId(branchId) } },
      {
        $lookup: {
          from: 'books',
          localField: 'bookId',
          foreignField: '_id',
          as: 'book'
        }
      },
      { $unwind: '$book' },
      {
        $project: {
          _id: 0,
          bookId: '$book._id',
          title: '$book.title',
          quantity: 1
        }
      },
      { $sort: { title: 1 } }
    ]);
  }

  async getStoreStockByBook(bookId: string) {
    if (!bookId) throw new BadRequestException('Thiếu bookId');

    const storeStocks = await this.connection.collection('storebranchinventories')
      .aggregate([
        { $match: { book: new Types.ObjectId(bookId) } },
        {
          $lookup: {
            from: 'storebranches',
            localField: 'storeBranch',
            foreignField: '_id',
            as: 'storeBranch'
          }
        },
        { $unwind: { path: '$storeBranch', preserveNullAndEmptyArrays: true } },
        {
          $project: {
            _id: '$storeBranch._id',             
            name: '$storeBranch.name',
            region: '$storeBranch.region',
            city: '$storeBranch.city',
            address: '$storeBranch.address',
            quantity: 1
          }
        }
      ])
      .toArray();

    return storeStocks;
  }


}
