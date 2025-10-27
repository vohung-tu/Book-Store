import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
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
    
    // @InjectModel(Branch.name)
    // private readonly branchModel: Model<Branch & Document>,

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
   async createImport(dto: CreateImportDto & { branchId?: string }, userId: string): Promise<any> {
    if (!dto.lines?.length) throw new BadRequestException('Danh sách sản phẩm rỗng!');

    const session = await this.connection.startSession();
    session.startTransaction();

    try {
      const date = new Date(dto.date);
      const code = await this.generateCode('NK', date, session);

      // 🔍 Tìm chi nhánh (nếu có)
      const branch = dto.branchId
        ? await this.branchModel.findById(dto.branchId).session(session)
        : await this.branchModel.findOne({ name: 'Kho Hồ Chí Minh' }).session(session);

      if (!branch) throw new NotFoundException('Không tìm thấy chi nhánh nhập kho');

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
        const book = await this.bookModel.findById(line.bookId).session(session);
        if (!book) throw new NotFoundException(`Không tìm thấy sách: ${line.bookId}`);

        // ✅ Cập nhật tồn kho tổng (trên bảng Book)
        const newStock = (book.stockQuantity ?? 0) + line.quantity;
        book.stockQuantity = newStock;
        book.quantity = newStock;
        await book.save({ session });

        // ✅ Cập nhật tồn kho chi nhánh được chọn
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

      // 2️⃣ Ép branchId về ObjectId (nếu đang lưu là string)
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

      // 3️⃣ Join với collection "branches"
      {
        $lookup: {
          from: "branches",              // ✅ chính xác tên collection trong MongoDB
          localField: "branchIdObj",     // dùng field đã ép kiểu
          foreignField: "_id",
          as: "branch"
        }
      },

      // 4️⃣ Lấy phần tử đầu trong mảng branch
      { $unwind: { path: "$branch", preserveNullAndEmptyArrays: true } },

      // 5️⃣ Chỉ trả về tên chi nhánh & tồn kho
      {
        $project: {
          _id: 0,
          branchName: "$branch.name",  // ✅ lấy tên chi nhánh
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
}
