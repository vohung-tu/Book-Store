import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { Author } from 'src/authors/authors.schema';

export type BookDocument = Book & Document;

@Schema()
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
}

export const BookSchema = SchemaFactory.createForClass(Book);
BookSchema.index({ categoryName: 1 });