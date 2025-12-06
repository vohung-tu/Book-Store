import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type NotificationDocument = Notification & Document;

@Schema({ timestamps: true })
export class Notification {
  @Prop({ type: String, required: true, index: true })
  userId: string;

  @Prop({ type: String, required: true })
  type: string; 
  // 'order_created' | 'order_shipping' | 'order_delivered' | 'order_cancelled' | 'coupon' | 'promotion' ...

  @Prop({ type: String, required: true })
  title: string;

  @Prop({ type: String, required: true })
  message: string;

  @Prop({ type: Boolean, default: false })
  isRead: boolean;

  @Prop({ type: Object })
  meta?: Record<string, any>;
}

export const NotificationSchema = SchemaFactory.createForClass(Notification);
