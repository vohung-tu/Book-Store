import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

@Schema({ timestamps: true })
export class InventoryReceiptDetail {
  _id: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'InventoryReceipt', required: true, index: true })
  receiptId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Book', required: true, index: true })
  bookId: Types.ObjectId;

  @Prop({ required: true, min: 1 }) quantity: number;
  @Prop({ default: 0, min: 0 }) unitPrice: number;
  @Prop({ default: 0, min: 0 }) subtotal: number;
}

export type InventoryReceiptDetailDocument = HydratedDocument<InventoryReceiptDetail>;
export const InventoryReceiptDetailSchema = SchemaFactory.createForClass(InventoryReceiptDetail);
