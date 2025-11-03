import { Injectable, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { StoreTransferReceipt } from '../schemas/store-transfer.schema';
import { StoreBranchInventory } from 'src/store-branch/schemas/store-branch-inventory.schema';
import { WarehouseAdmin } from '../schemas/warehouse-admin.schema';
import { StoreBranch } from 'src/store-branch/schemas/store-branch.schema';

@Injectable()
export class StoreTransferService {
  constructor(
    @InjectModel(StoreTransferReceipt.name)
    private readonly transferModel: Model<StoreTransferReceipt>,

    @InjectModel(StoreBranchInventory.name)
    private readonly storeBranchInventoryModel: Model<StoreBranchInventory>,

    @InjectModel(WarehouseAdmin.name)
    private readonly warehouseModel: Model<WarehouseAdmin>,

    @InjectModel(StoreBranch.name)
    private readonly storeBranchModel: Model<StoreBranch>,
  ) {}

  /**
   * 📦 Sinh mã phiếu chuyển tự động
   */
  private async generateTransferCode(): Promise<string> {
    const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    const count = await this.transferModel.countDocuments({
      code: new RegExp(`^CK${dateStr}`),
    });
    const nextNum = (count + 1).toString().padStart(3, '0');
    return `CK${dateStr}-${nextNum}`;
  }

  /**
   * 🚚 Chuyển hàng từ kho đến cửa hàng
   */
  async transferToStore(dto: {
    fromWarehouse: string;
    toStore: string;
    items: { bookId: string; quantity: number }[];
    note?: string;
  }) {
    if (!dto.items?.length) {
      throw new BadRequestException('Danh sách hàng hóa không được trống!');
    }

    const code = await this.generateTransferCode();

    const transfer = await this.transferModel.create({
      code,
      date: new Date(),
      fromWarehouse: new Types.ObjectId(dto.fromWarehouse),
      toStore: new Types.ObjectId(dto.toStore),
      items: dto.items.map((i) => ({
        bookId: new Types.ObjectId(i.bookId),
        quantity: i.quantity,
      })),
      note: dto.note || '',
    });

    // ✅ Cập nhật tồn kho cửa hàng
    for (const item of dto.items) {
      await this.storeBranchInventoryModel.updateOne(
        {
          storeBranch: new Types.ObjectId(dto.toStore),
          book: new Types.ObjectId(item.bookId),
        },
        { $inc: { quantity: item.quantity } },
        { upsert: true },
      );
    }

    return {
      message: 'Chuyển hàng thành công',
      code,
      transfer,
    };
  }

  /**
   * 📜 Lấy danh sách phiếu chuyển
   */
  async getAllTransfers() {
    return this.transferModel
      .find()
      .populate('fromWarehouse', 'name region')
      .populate('toStore', 'name city region')
      .sort({ createdAt: -1 })
      .lean();
  }
}
