import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Delete,
  Put,
  UseGuards,
  Req,
} from '@nestjs/common';
import { Coupon } from './coupon.schema';
import { CouponsService } from './coupon.service';
import { JwtAuthGuard } from 'src/users/auth/jwt.auth.guard';

@Controller('coupons')
export class CouponsController {
  constructor(private readonly couponsService: CouponsService) {}

  // Tạo coupon
  @Post()
  create(@Body() body: Partial<Coupon>) {
    return this.couponsService.create(body);
  }

  // LẤY COUPON CÒN HIỆU LỰC (đặt TRƯỚC findOne)
  @Get('valid')
  async findValid() {
    return this.couponsService.findValid();
  }

  //  LẤY COUPON THEO LEVEL (đặt TRƯỚC findOne)
  @Get('level/:level')
  async findByLevel(@Param('level') level: string) {
    return this.couponsService.findEligibleForLevel(level);
  }

  // Kiểm tra mã coupon
  @Get('validate/:code')
  async validate(@Param('code') code: string) {
    const coupon = await this.couponsService.findByCode(code);
    if (!coupon) {
      return { valid: false, message: 'Mã giảm giá không tồn tại hoặc đã hết hạn' };
    }

    const now = new Date();
    if (coupon.startDate && now < coupon.startDate) {
      return { valid: false, message: 'Mã chưa đến thời gian áp dụng' };
    }
    if (coupon.endDate && now > coupon.endDate) {
      return { valid: false, message: 'Mã đã hết hạn' };
    }
    if (coupon.status !== 'active') {
      return { valid: false, message: 'Mã đã bị vô hiệu hóa' };
    }

    return { valid: true, coupon };
  }

  // Lấy tất cả coupon (admin)
  @Get()
  findAll() {
    return this.couponsService.findAll();
  }

  // Lấy coupon theo ID (đặt sau cùng để tránh conflict)
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.couponsService.findOne(id);
  }

  // Cập nhật coupon
  @Put(':id')
  update(@Param('id') id: string, @Body() body: Partial<Coupon>) {
    return this.couponsService.update(id, body);
  }

  //  Xoá coupon
  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.couponsService.delete(id);
  }

  //  Dành cho user đã login (JWT)
  @UseGuards(JwtAuthGuard)
  @Get('available/me')
  async findAvailableForUser(@Req() req: any) {
    const user = req.user;
    const coupons = await this.couponsService.findEligibleForLevel(user.level);
    return coupons;
  }
}
