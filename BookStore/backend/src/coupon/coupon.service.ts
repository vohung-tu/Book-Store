import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Coupon, CouponDocument } from './coupon.schema';
import { Model } from 'mongoose';

@Injectable()
export class CouponsService {
  constructor(@InjectModel(Coupon.name) private couponModel: Model<CouponDocument>) {}

  async create(data: Partial<Coupon>): Promise<Coupon> {
    const exists = await this.couponModel.findOne({ code: data.code });
    if (exists) throw new BadRequestException('Mã coupon đã tồn tại');
    return this.couponModel.create(data);
  }

  async findAll(): Promise<Coupon[]> {
    return this.couponModel.find().sort({ createdAt: -1 }).exec();
  }

  async findOne(id: string): Promise<Coupon> {
    const coupon = await this.couponModel.findById(id).exec();
    if (!coupon) throw new NotFoundException('Coupon không tồn tại');
    return coupon;
  }

  async update(id: string, data: Partial<Coupon>): Promise<Coupon> {
    const coupon = await this.couponModel.findByIdAndUpdate(id, data, { new: true }).exec();
    if (!coupon) throw new NotFoundException('Không tìm thấy coupon để cập nhật');
    return coupon;
  }

  async delete(id: string): Promise<void> {
    const result = await this.couponModel.findByIdAndDelete(id).exec();
    if (!result) throw new NotFoundException('Không tìm thấy coupon để xóa');
  }

  async findByCode(code: string): Promise<Coupon | null> {
    return this.couponModel.findOne({ code }).exec();
  }

  // 🟣 Thêm tiện ích: lọc coupon theo level
  async findEligibleForLevel(level: string): Promise<Coupon[]> {
    const all = await this.findAll();

    // ✅ lọc coupon mà requiredLevel chứa level hiện tại
    return all.filter(c => {
      if (Array.isArray(c.requiredLevel)) {
        return c.requiredLevel.includes(level);
      }
      // phòng trường hợp dữ liệu cũ vẫn là string
      return c.requiredLevel === level;
    });
  }

}
