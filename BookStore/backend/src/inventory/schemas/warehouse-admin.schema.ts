import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

@Schema({ timestamps: true })
export class WarehouseAdmin {
  @Prop({ required: true, unique: true })
  code: string; // Ví dụ: "BR001"

  @Prop({ required: true })
  name: string; // Tên chi nhánh, ví dụ "Kho Hà Nội"

  @Prop()
  region: string;

  @Prop()
  address: string;

  @Prop()
  managerName: string;

  @Prop({ required: true })
  managerEmail: string;

  @Prop()
  managerPhone: string;
}

export type WarehouseAdminDocument = HydratedDocument<WarehouseAdmin>;
export const WarehouseAdminSchema = SchemaFactory.createForClass(WarehouseAdmin);
