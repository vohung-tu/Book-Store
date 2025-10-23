import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { WarehouseAdmin } from '../schemas/warehouse-admin.schema';


@Injectable()
export class WarehouseAdminService {
  constructor(
    @InjectModel(WarehouseAdmin.name)
    private readonly warehouseModel: Model<WarehouseAdmin>,
  ) {}

  async findAll() {
    return this.warehouseModel.find().sort({ region: 1, name: 1 }).lean();
  }

  async findOne(id: string) {
    const item = await this.warehouseModel.findById(id).lean();
    if (!item) throw new NotFoundException('Không tìm thấy chi nhánh');
    return item;
  }

  async create(data: any) {
    const code = data.code || `BR${Date.now().toString().slice(-5)}`;
    const created = new this.warehouseModel({ ...data, code });
    return created.save();
  }

  async update(id: string, data: any) {
    const updated = await this.warehouseModel.findByIdAndUpdate(id, data, { new: true }).lean();
    if (!updated) throw new NotFoundException('Chi nhánh không tồn tại');
    return updated;
  }

  async remove(id: string) {
    const deleted = await this.warehouseModel.findByIdAndDelete(id);
    if (!deleted) throw new NotFoundException('Chi nhánh không tồn tại');
    return { message: 'Đã xóa chi nhánh thành công' };
  }
}
