import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema, Types } from 'mongoose';

@Schema({ _id: false }) // subdocument không cần _id riêng
export class OrderProduct {
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
  @Prop({ required: true })
  userId: string;

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

  @Prop()
  total: number;

  @Prop({
    enum: ['pending', 'processing', 'shipping', 'completed', 'cancelled', 'returned'],
    default: 'pending'
  })
  status: string;

  @Prop()
  orderDate: Date;
}

export const OrderSchema = SchemaFactory.createForClass(Order);
