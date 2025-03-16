import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

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

  @Prop({ type: Date })
  publishedDate: Date;
}

export const BookSchema = SchemaFactory.createForClass(Book);
