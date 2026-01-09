import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type WishlistDocument = Wishlist & Document;

@Schema({ timestamps: true, collection: 'wishlists' })
export class Wishlist {
  @Prop({ type: Types.ObjectId, ref: 'User', required: true, index: true })
  userId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Book', required: true })
  bookId: Types.ObjectId;
}

export const WishlistSchema = SchemaFactory.createForClass(Wishlist);

WishlistSchema.index({ userId: 1, bookId: 1 }, { unique: true });