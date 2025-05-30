import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';
import { Review, ReviewSchema } from 'src/review/review.schema';

export type BookDocument = Book & Document;

@Schema()
export class Book {
  @Prop({ required: true })
  title: string;

  @Prop()
  author: string;

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

  @Prop({ required: true })
  categoryName: string;

  @Prop({ required: true })
  quantity: number;
}

export const BookSchema = SchemaFactory.createForClass(Book);
