import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type ReviewDocument = Review & Document;

@Schema()
export class Review {
  @Prop({ required: true })
  productId: string;

  @Prop()
  name: string;

  @Prop()
  comment: string;

  @Prop({ required: true, min: 1, max: 5 })
  rating: number;

  @Prop({ default: false })
  anonymous: boolean;

  @Prop({ default: Date.now })
  createdAt: Date;

  @Prop([String])
  images: string[]; // URLs to uploaded images

  @Prop([String])
  videos: string[]; // URLs to uploaded videos
}

export const ReviewSchema = SchemaFactory.createForClass(Review);
