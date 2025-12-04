import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { Document } from 'mongoose';

@Schema({ timestamps: true })
export class ViewHistory {
  @Prop({ required: true })
  userId: string;

  @Prop({ required: true })
  bookId: string;

  @Prop({ default: Date.now })
  viewedAt: Date;
}

export type ViewHistoryDocument = ViewHistory & Document;
export const ViewHistorySchema = SchemaFactory.createForClass(ViewHistory);