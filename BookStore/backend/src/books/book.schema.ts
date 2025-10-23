import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { Author } from 'src/authors/authors.schema';

export type BookDocument = Book & Document;

@Schema({ timestamps: true }) 
export class Book {
  @Prop({ required: true })
  title: string;

  @Prop({ type: Types.ObjectId, ref: 'Author', required: false })
  author: Author | Types.ObjectId;

  @Prop()
  description: string;

  @Prop()
  price: number;

  @Prop()
  flashsale_price: number;

  @Prop()
  discount_percent: number;

  @Prop()
  coverImage: string;
  
  @Prop({ type: [String], default: [] })
  images: string[];

  @Prop({ type: Date })
  publishedDate: Date;

  @Prop({ required: true, lowercase: true, trim: true })
  categoryName: string;

  @Prop({ required: true })
  quantity: number;

  @Prop({ type: Number, default: 0 })
  sold: number;

  @Prop({ type: String, default: '' })
  summary_ai: string;

  @Prop({ default: 0, min: 0, index: true })
  stockQuantity: number; // ✅ số lượng tồn hiện tại

  @Prop({ type: Types.ObjectId, ref: 'Supplier', required: false })
  supplierId?: Types.ObjectId;
}

export const BookSchema = SchemaFactory.createForClass(Book);
BookSchema.index({ createdAt: -1 });
BookSchema.index({ sold: -1 });
BookSchema.index({ categoryName: 1 });