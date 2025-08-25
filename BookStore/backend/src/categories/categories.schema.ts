import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import mongoose, { Document } from 'mongoose';

export type CategoryDocument = Category & Document;

@Schema({ timestamps: true })
export class Category {
  @Prop({ required: true, trim: true })
  name: string;

  @Prop({ required: true, unique: true, lowercase: true, trim: true }) // ví dụ: "sach-trong-nuoc"
  slug: string;

  @Prop({ type: mongoose.Schema.Types.ObjectId, ref: 'Category', default: null })
  parentId?: string | null;
}
export const CategorySchema = SchemaFactory.createForClass(Category);
