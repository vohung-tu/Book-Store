import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema, Types } from 'mongoose';
import { WarehouseAdmin } from 'src/inventory/schemas/warehouse-admin.schema';

@Schema({ timestamps: true })
export class StoreBranch {
  @Prop({ required: true })
  code: string;

  @Prop({ required: true })
  name: string;

  @Prop({ required: true })
  address: string;

  @Prop({ required: true })
  district: string;

  @Prop({ required: true })
  city: string;

  @Prop({ required: true })
  region: string; // Miền Bắc / Trung / Nam

  @Prop()
  phone?: string;

  @Prop()
  mapUrl?: string;

  @Prop({ type: Types.ObjectId, ref: 'Warehouse' })
  warehouse?: WarehouseAdmin;

}

export type StoreBranchDocument = StoreBranch & Document;
export const StoreBranchSchema = SchemaFactory.createForClass(StoreBranch);

StoreBranchSchema.index({ geoLocation: '2dsphere' });
