import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

@Schema({ timestamps: true })
export class Supplier {
  @Prop({ required: true, unique: true })
  code: string; // Mã NCC

  @Prop({ required: true })
  name: string; // Tên NCC

  @Prop()
  address: string;

  @Prop()
  email: string;

  @Prop()
  phone: string;

  @Prop()
  note: string;

  createdAt?: Date;
  updatedAt?: Date;
}

export type SupplierDocument = HydratedDocument<Supplier>;
export const SupplierSchema = SchemaFactory.createForClass(Supplier);
