import { Controller, Get, Post, Body, Param, Delete, Put, UseGuards, Req } from '@nestjs/common';
import { Coupon } from './coupon.schema';
import { CouponsService } from './coupon.service';
import { JwtAuthGuard } from 'src/users/auth/jwt.auth.guard';

@Controller('coupons')
export class CouponsController {
  constructor(private readonly couponsService: CouponsService) {}

  @Post()
  create(@Body() body: Partial<Coupon>) {
    return this.couponsService.create(body);
  }

  @Get()
  findAll() {
    return this.couponsService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.couponsService.findOne(id);
  }

  @Put(':id')
  update(@Param('id') id: string, @Body() body: Partial<Coupon>) {
    return this.couponsService.update(id, body);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.couponsService.delete(id);
  }

  @Get('validate/:code')
    async validate(@Param('code') code: string) {
    const coupon = await this.couponsService.findByCode(code);
    if (!coupon) {
        return { valid: false, message: 'Mã giảm giá không tồn tại' };
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

  @UseGuards(JwtAuthGuard)
  @Get('available/me')
  async findAvailableForUser(@Req() req: any) {
    const user = req.user;
    const coupons = await this.couponsService.findAll();

    // coupon hợp lệ nếu danh sách requiredLevel có chứa user.level
    const filtered = coupons.filter(c =>
      Array.isArray(c.requiredLevel)
        ? c.requiredLevel.includes(user.level)
        : c.requiredLevel === user.level
    );

    return filtered;
  }
    //  Helper so sánh cấp độ
  private isEligible(required: string, userLevel: string): boolean {
    const order = ['member', 'silver', 'gold', 'diamond'];
    return order.indexOf(userLevel) >= order.indexOf(required);
  }

}
