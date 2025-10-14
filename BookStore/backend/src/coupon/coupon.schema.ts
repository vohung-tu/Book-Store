import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type CouponDocument = Coupon & Document;

@Schema({ timestamps: true })
export class Coupon {
  @Prop({ required: true, unique: true })
  code: string; // Mã coupon

  @Prop({ enum: ['percent', 'amount'], required: true })
  type: 'percent' | 'amount'; // percent: giảm %, amount: giảm số tiền

  @Prop({ required: true })
  value: number; // Giá trị giảm (VD: 10 => 10%)

  @Prop({ default: 0 })
  minOrder: number; // Giá trị đơn hàng tối thiểu

  @Prop({ type: Date, required: true })
  startDate: Date;

  @Prop({ type: Date, required: true })
  endDate: Date;

  @Prop({ default: 0 })
  usageCount: number; // Đã sử dụng

  @Prop({ default: 0 })
  usageLimit: number; // Giới hạn số lần sử dụng (0 = không giới hạn)

  @Prop({ default: 'active' })
  status: 'active' | 'disabled' | 'expired';

  @Prop({ required: true })
  title: string;        

  @Prop()
  description: string;
    
  @Prop()
  condition: string;

  @Prop()
  categories: string[];

  @Prop({
    type: [String],
    enum: ['member', 'silver', 'gold', 'diamond'],
    default: ['member']
  })
  requiredLevel: string[];
}

export const CouponSchema = SchemaFactory.createForClass(Coupon);
