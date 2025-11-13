import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

@Schema({ timestamps: true })
export class StoreTransferReceipt extends Document {
  @Prop({ required: true, unique: true })
  code: string; // Ví dụ: CK20251103-001

  @Prop({ type: Types.ObjectId, ref: 'WarehouseAdmin', required: true })
  fromWarehouse: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'StoreBranch', required: true })
  toStore: Types.ObjectId;

  @Prop({ type: Date, required: true })
  date: Date;

  @Prop({
    type: [
      {
        bookId: { type: Types.ObjectId, ref: 'Book', required: true },
        quantity: { type: Number, required: true, min: 1 },
        unitPrice: Number,
        subtotal: Number,
      },
    ],
    default: [],
  })
  items: { bookId: Types.ObjectId; quantity: number }[];

  @Prop()
  note?: string;
}

export type StoreTransferReceiptDocument = StoreTransferReceipt & Document;
export const StoreTransferReceiptSchema =
  SchemaFactory.createForClass(StoreTransferReceipt);
