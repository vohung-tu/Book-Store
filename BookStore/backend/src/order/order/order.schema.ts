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
}

export const OrderSchema = SchemaFactory.createForClass(Order);
