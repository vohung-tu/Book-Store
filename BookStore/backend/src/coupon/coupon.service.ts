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
    const coupons = await this.couponModel.find().sort({ createdAt: -1 }).exec();
    const now = new Date();

    for (const c of coupons) {
      const isExpired = c.endDate && new Date(c.endDate) < now;
      const newStatus = isExpired ? 'expired' : 'active';

      // Nếu DB chưa đúng trạng thái thì cập nhật lại
      if (c.status !== newStatus) {
        await this.couponModel.updateOne({ _id: c._id }, { status: newStatus });
        c.status = newStatus;
      }
    }

    return coupons;
  }

  async findOne(id: string): Promise<Coupon> {
    const coupon = await this.couponModel.findById(id).exec();
    if (!coupon) throw new NotFoundException('Coupon không tồn tại');

    // Cập nhật trạng thái nếu đã hết hạn
    const now = new Date();
    if (coupon.endDate && new Date(coupon.endDate) < now && coupon.status !== 'expired') {
      coupon.status = 'expired';
      await coupon.save();
    }

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
      const coupon = await this.couponModel.findOne({ code }).exec();

      // Khi gọi API validate code, nếu hết hạn thì không hợp lệ
      if (coupon && coupon.endDate && new Date(coupon.endDate) < new Date()) {
        await this.couponModel.updateOne({ _id: coupon._id }, { status: 'expired' });
        return null;
      }

      return coupon;
    }

  // 🟣 Thêm tiện ích: lọc coupon theo level
  async findEligibleForLevel(level: string): Promise<Coupon[]> {
    const all = await this.findAll();

    // lọc coupon mà requiredLevel chứa level hiện tại
    return all.filter(c => {
      if (Array.isArray(c.requiredLevel)) {
        return c.requiredLevel.includes(level);
      }
      // phòng trường hợp dữ liệu cũ vẫn là string
      return c.requiredLevel === level;
    });
  }

  async findValid(): Promise<Coupon[]> {
    const now = new Date();
    return this.couponModel.find({
      startDate: { $lte: now },
      endDate: { $gte: now },
      status: 'active'
    }).exec();
  }

}
