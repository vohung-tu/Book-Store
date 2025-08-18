import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type CategoryDocument = Category & Document;

@Schema({ timestamps: true })
export class Category {
  @Prop({ required: true, trim: true })
  name: string;

  @Prop({ required: true, unique: true, lowercase: true, trim: true }) // ví dụ: "sach-trong-nuoc"
  slug: string;

  // Mở rộng sau:
  // @Prop({ type: Types.ObjectId, ref: 'Category', default: null })
  // parent?: Types.ObjectId;
}
export const CategorySchema = SchemaFactory.createForClass(Category);
