import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { Document, Types } from "mongoose";

export type CartItemDocument = CartItem & Document;

@Schema({ timestamps: true })
export class CartItem {
  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  user: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Book', required: true })
  product: Types.ObjectId;

  @Prop({ type: Number, default: 1 })
  quantity: number;
}

export const CartItemSchema = SchemaFactory.createForClass(CartItem);

CartItemSchema.index({ user: 1 });
CartItemSchema.index({ user: 1, product: 1 }, { unique: true }); // chặn trùng & nhanh lookup