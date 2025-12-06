import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema, Types } from 'mongoose';

@Schema({ _id: false })
export class OrderProduct {
  _id?: Types.ObjectId;

  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'Book', required: true })
  book: Types.ObjectId;

  @Prop({ required: true })
  title: string;

  @Prop({ required: true })
  price: number;

  @Prop()
  flashsale_price?: number;

  @Prop({ required: true })
  quantity: number;

  @Prop()
  coverImage?: string;
}

export const OrderProductSchema = SchemaFactory.createForClass(OrderProduct);

/* ============================================================
   Order Schema chính
   ============================================================ */

@Schema({ timestamps: true })
export class Order {
  // 👇 Quan trọng: khai báo _id để TS hiểu đúng loại
  _id: Types.ObjectId;

  @Prop({ required: true, unique: true })
  code: string; // mã đơn hàng (DH-xxxx)

  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'User', required: true })
  userId: Types.ObjectId;

  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'StoreBranch' })
  storeBranchId?: Types.ObjectId;

  @Prop({ required: true })
  address: string;

  @Prop()
  note?: string;

  @Prop({ type: [OrderProductSchema], required: true })
  products: OrderProduct[];

  @Prop()
  name?: string;

  @Prop()
  phone?: string;

  @Prop()
  email?: string;

  @Prop({ required: true })
  total: number;

  @Prop({
    enum: ['pending', 'processing', 'shipping', 'completed', 'cancelled', 'returned'],
    default: 'pending',
  })
  status: string;

  @Prop({ default: false })
  loyaltyApplied: boolean;

  @Prop()
  orderDate?: Date;
}

export type OrderDocument = Order & Document;

export const OrderSchema = SchemaFactory.createForClass(Order);
