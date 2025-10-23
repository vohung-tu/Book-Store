import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

/**
 * ===============================
 * 📍 Branch Schema — Chi nhánh kho
 * ===============================
 */
@Schema({ timestamps: true })
export class Branch extends Document {
  @Prop({ required: true })
  name: string; // Tên chi nhánh (VD: Kho HCM, Kho Hà Nội)

  @Prop()
  address?: string;

  @Prop()
  region?: string; // Khu vực (Miền Nam / Bắc / Trung)

  @Prop()
  phone?: string;
}

export const BranchSchema = SchemaFactory.createForClass(Branch);

/**
 * ================================================
 * 📦 Inventory Schema — Tồn kho từng chi nhánh
 * ================================================
 */
@Schema({ timestamps: true })
export class Inventory extends Document {
  @Prop({ type: Types.ObjectId, ref: 'Book', required: true })
  bookId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Branch', required: true })
  branchId: Types.ObjectId;

  @Prop({ required: true, default: 0, min: 0 })
  quantity: number;
}

export const InventorySchema = SchemaFactory.createForClass(Inventory);
