import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";

@Schema({ timestamps: true })
export class Review extends Document {
  @Prop() name: string;
  @Prop() comment: string;
  @Prop() rating: number;
  @Prop() productId: string;
}

export const ReviewSchema = SchemaFactory.createForClass(Review);