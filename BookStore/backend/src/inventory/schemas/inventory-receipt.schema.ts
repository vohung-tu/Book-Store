import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

export type ReceiptType = 'import' | 'export';
export type InventoryReceiptDocument = HydratedDocument<InventoryReceipt>;

@Schema({ timestamps: true })
export class InventoryReceipt {
  _id: Types.ObjectId;

  @Prop({ required: true })
  code: string;

  @Prop({ enum: ['import', 'export'], required: true, index: true })
  type: ReceiptType;

  @Prop({ type: Date, required: true, index: true })
  date: Date;

  @Prop() supplierName?: string;
  @Prop() receiverName?: string;
  @Prop({ default: '' }) reason: string;

  @Prop({ default: 0, min: 0 }) totalQuantity: number;
  @Prop({ default: 0, min: 0 }) totalAmount: number;

  @Prop({ type: Types.ObjectId, ref: 'User', index: true })
  createdBy: Types.ObjectId;

  // ✅ CHỈNH ref CHUẨN ở đây
  @Prop({ type: [{ type: Types.ObjectId, ref: 'InventoryReceiptDetail' }], default: [] })
  details: Types.ObjectId[];
}

export const InventoryReceiptSchema = SchemaFactory.createForClass(InventoryReceipt);
InventoryReceiptSchema.index({ code: 1 }, { unique: true });
