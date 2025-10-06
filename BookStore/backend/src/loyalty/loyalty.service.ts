import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import mongoose, { Model, Types } from 'mongoose';
import { Order } from 'src/order/order/order.schema';
import { User } from 'src/users/user.schema';

@Injectable()
export class LoyaltyService {
  constructor(@InjectModel(User.name) private userModel: Model<User>,
  @InjectModel(Order.name) private orderModel: Model<Order>) {}

  /**
   * Tự động cập nhật khi hoàn tất đơn hàng
   */
  async updateLoyaltyAfterOrder(userId: string | Types.ObjectId, orderTotal: number) {
    // Đảm bảo userId luôn là string để truy vấn
    const id = typeof userId === 'string' ? userId : userId.toString();
    const user = await this.userModel.findById(id);

    if (!user) return null;

    // Nếu user chưa có totalSpent thì gán mặc định là 0
    if (!user.totalSpent) user.totalSpent = 0;

    // Cộng thêm tổng tiền của đơn hàng
    user.totalSpent += orderTotal;

    // Tính cấp độ mới dựa theo tổng chi tiêu
    const newLevel = this.calculateLevel(user.totalSpent);

    // Nếu có thay đổi cấp độ thì cập nhật
    if (user.level !== newLevel) {
      user.level = newLevel;
    }

    await user.save();
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
  async getUserLoyalty(userId: string) {
    const user = await this.userModel.findById(userId).lean();
    if (!user) throw new NotFoundException('User not found');

    const orderStats = await this.orderModel.aggregate([
      {
        $match: {
          userId: userId.toString(), // ép về string để khớp DB
          status: 'completed'        // hoặc bỏ nếu muốn test tất cả
        }
      },
      {
        $group: {
          _id: null,
          totalSpent: { $sum: '$total' },
          orderCount: { $sum: 1 }
        }
      }
    ]);

    console.log('📊 Aggregate result:', orderStats);

    const totalSpent = orderStats[0]?.totalSpent || 0;
    const orderCount = orderStats[0]?.orderCount || 0;
    const level = this.getLevel(totalSpent);

    return {
      fullName: user.full_name,
      email: user.email,
      totalSpent,
      orderCount,
      level
    };
  }

}
