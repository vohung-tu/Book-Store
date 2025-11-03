import { Injectable, NotFoundException, InternalServerErrorException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Book, BookDocument } from '../books/book.schema';
import { StoreBranch, StoreBranchDocument } from './schemas/store-branch.schema';

@Injectable()
export class StoreBranchService {
  constructor(
    @InjectModel(StoreBranch.name)
    private readonly storeBranchModel: Model<StoreBranchDocument>,
    @InjectModel(Book.name)
    private readonly bookModel: Model<BookDocument>,
  ) {}

  async create(data: Partial<StoreBranch>): Promise<StoreBranch> {
    try {
      if (!data.code) {
        const count = await this.storeBranchModel.countDocuments();
        const today = new Date().toISOString().slice(0, 10).replace(/-/g, '');
        data.code = `CN${today}-${(count + 1).toString().padStart(3, '0')}`;
      }

      const created = new this.storeBranchModel(data);
      return await created.save();
    } catch (err) {
      console.error('❌ Lỗi khi lưu chi nhánh:', err);
      throw new InternalServerErrorException(err.message);
    }
  }

  async findAll() {
    return await this.storeBranchModel.find().lean();
  }

  async findById(id: string) {
    const found = await this.storeBranchModel.findById(id);
    if (!found) throw new NotFoundException('Không tìm thấy chi nhánh');
    return found;
  }

  async update(id: string, data: Partial<StoreBranch>) {
    const updated = await this.storeBranchModel.findByIdAndUpdate(id, data, { new: true });
    if (!updated) throw new NotFoundException('Chi nhánh không tồn tại');
    return updated;
  }

  async remove(id: string) {
    const deleted = await this.storeBranchModel.findByIdAndDelete(id);
    if (!deleted) throw new NotFoundException('Chi nhánh không tồn tại');
    return deleted;
  }

  async getAvailableBranches(bookId: string) {
    return await this.storeBranchModel.aggregate([
      { $lookup: { from: 'storebranchinventories', localField: '_id', foreignField: 'branchId', as: 'inventory' } },
      { $unwind: '$inventory' },
      { $match: { 'inventory.bookId': bookId } },
      {
        $project: {
          name: 1,
          address: 1,
          quantity: '$inventory.quantity',
        },
      },
    ]);
  }

  async updateInventory(branchId: string, bookId: string, quantity: number) {
    return await this.bookModel.findByIdAndUpdate(bookId, { $inc: { stockQuantity: quantity } });
  }

  async findNearestBranches(lat: number, lng: number, limit: number) {
    return await this.storeBranchModel
      .aggregate([
        {
          $geoNear: {
            near: { type: 'Point', coordinates: [lng, lat] },
            distanceField: 'distance',
            spherical: true,
          },
        },
        { $limit: limit },
      ])
      .exec();
  }
}
