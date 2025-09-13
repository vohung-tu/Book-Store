import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';

import { Coupon, CouponSchema } from './coupon.schema';
import { CouponsService } from './coupon.service';
import { CouponsController } from './coupon.controller';

@Module({
  imports: [MongooseModule.forFeature([{ name: Coupon.name, schema: CouponSchema }])],
  providers: [CouponsService],
  controllers: [CouponsController],
})
export class CouponsModule {}
