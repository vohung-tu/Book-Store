import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

@Schema({ timestamps: true })
export class Order extends Document {
  @Prop({ required: true })
  userId: string;

  @Prop({ required: true })
  address: string;

  @Prop()
  note?: string;

  @Prop({ required: true, type: Array })
  products: any[];

  @Prop()
  name: string;

  @Prop()
  phone: string;

  @Prop()
  email: string;

  @Prop()
  total: number;

  @Prop({ enum: ['pending', 'processing', 'shipping', 'completed', 'cancelled', 'returned'], default: 'pending' })
  status: string;

  @Prop()
  orderDate: Date;

}

export const OrderSchema = SchemaFactory.createForClass(Order);
