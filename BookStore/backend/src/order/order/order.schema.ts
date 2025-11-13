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

  @Prop({ required: true })
  quantity: number;

  @Prop()
  coverImage: string;
}
const OrderProductSchema = SchemaFactory.createForClass(OrderProduct);

@Schema({ timestamps: true })
export class Order extends Document {
  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'User', required: true })
  userId: Types.ObjectId;

  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'StoreBranch', required: false })
  storeBranchId?: Types.ObjectId;

  @Prop({ required: true })
  address: string;

  @Prop()
  note?: string;

  @Prop({ type: [OrderProductSchema], required: true })
  products: OrderProduct[];

  @Prop()
  name: string;

  @Prop()
  phone: string;

  @Prop()
  email: string;

  @Prop({ required: true })
  total: number;

  @Prop({
    enum: ['pending', 'processing', 'shipping', 'completed', 'cancelled', 'returned'],
    default: 'pending',
  })
  status: string;

  @Prop({ default: false })          // ✅ đặt ở cấp Order
  loyaltyApplied: boolean;

  @Prop()
  orderDate: Date;
}
export const OrderSchema = SchemaFactory.createForClass(Order);
