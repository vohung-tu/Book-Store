import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

@Schema({ timestamps: true })
export class ChatHistory {
  @Prop({ type: Types.ObjectId, required: true })
  userId: string;

  @Prop({
    type: [
      {
        role: { type: String, enum: ['user', 'bot'], required: true },
        content: { type: String, required: true },
        createdAt: { type: Date, default: Date.now },
      },
    ],
    default: [],
  })
  messages: { role: 'user' | 'bot'; content: string; createdAt: Date }[];
}

export type ChatHistoryDocument = ChatHistory & Document;
export const ChatHistorySchema = SchemaFactory.createForClass(ChatHistory);
