import { Controller, Get, Post, Body, Param, Delete, Put } from '@nestjs/common';
import { Coupon } from './coupon.schema';
import { CouponsService } from './coupon.service';

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

}
