import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import mongoose, { Model, Types } from 'mongoose';
import { Order } from 'src/order/order/order.schema';
import { User } from 'src/users/user.schema';

@Injectable()
export class LoyaltyService {
  constructor(@InjectModel(User.name) private userModel: Model<User>,
  @InjectModel(Order.name) private orderModel: Model<Order>) {}

  async updateLoyaltyAfterOrder(userId: string | Types.ObjectId, total: number) {
    const id = typeof userId === 'string' ? userId : String(userId);
    if (typeof total !== 'number' || Number.isNaN(total)) {
      throw new Error(`[LOYALTY] order total must be number`);
    }

    // tăng atomic; nếu chưa có field sẽ được tạo = total
    await this.userModel.updateOne({ _id: id }, { $inc: { totalSpent: total } });

    // đọc lại & cập nhật level nếu cần
    const user = await this.userModel.findById(id);
    if (!user) return null;

    const newLevel = this.calculateLevel(user.totalSpent || 0);
    if (user.level !== newLevel) {
      user.level = newLevel;
      await user.save();
    }
    return user;
  }

  /**
   * Hàm xác định cấp độ dựa trên tổng chi tiêu
   */
  calculateLevel(totalSpent: number): string {
    if (totalSpent >= 4_000_000) return 'diamond';
    if (totalSpent >= 2_000_000) return 'gold';
    if (totalSpent >= 1_000_000) return 'silver';
    return 'member';
  }

  /**
   * Dành cho admin: Lấy danh sách tất cả khách hàng thân thiết
   */
  async getAllCustomers() {
    // Lấy danh sách tất cả user
    const users = await this.userModel
      .find({}, { full_name: 1, email: 1, level: 1 })
      .lean();

    // Lấy tổng chi tiêu thực tế từ orders (chỉ tính đơn đã hoàn tất)
    const orderStats = await this.orderModel.aggregate([
      { $match: { status: 'completed' } },
      {
        $group: {
          _id: '$userId',
          totalSpent: { $sum: '$total' },
          orderCount: { $sum: 1 },
        },
      },
    ]);

    // Map kết quả order theo userId
    const statsMap = new Map(orderStats.map(o => [String(o._id), o]));

    // Trả về danh sách user kèm tổng chi tiêu
    return users.map(u => {
      const stat = statsMap.get(String(u._id));
      const totalSpent = stat ? stat.totalSpent : 0;
      const orderCount = stat ? stat.orderCount : 0;

      // ✅ nếu level trống (""), thì tính lại dựa theo totalSpent
      const computedLevel = this.getLevel(totalSpent);

      return {
        _id: u._id,
        fullName: u.full_name ?? '(Chưa có tên)',
        email: u.email,
        totalSpent,
        orderCount,
        level: computedLevel, // ✅ dùng giá trị đã xử lý
      };
    });
  }

  private getLevel(total: number): string {
    if (total >= 4_000_000) return 'diamond';
    if (total >= 2_000_000) return 'gold';
    if (total >= 1_000_000) return 'silver';
    return 'member';
  }
  /**
   * Dành cho admin: Cập nhật cấp độ thủ công
   */
  async updateCustomerLevel(userId: string, level: string) {
    return this.userModel.findByIdAndUpdate(
      userId,
      { level },
      { new: true }
    );
  }

  // Lấy loyalty info của 1 user
  async getUserLoyalty(userId: string | Types.ObjectId) {
    const uid = typeof userId === 'string' ? new Types.ObjectId(userId) : userId;

    const [user, orderCount] = await Promise.all([
      this.userModel.findById(uid).lean(),
      this.orderModel.countDocuments({ userId: uid, status: 'completed' }),
    ]);

    if (!user) throw new NotFoundException('User not found');

    const totalSpent = user.totalSpent ?? 0;       // lấy từ Users (đã $inc khi completed)
    const level = user.level ?? this.getLevel(totalSpent);

    return {
      fullName: user.full_name,
      email: user.email,
      totalSpent,
      orderCount,
      level,
    };
  }

}
