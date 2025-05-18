import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

@Schema({ timestamps: true })
export class Author extends Document {
  @Prop({ required: true })
  name: string;

  @Prop()
  description: string;

  @Prop()
  avatar: string; // URL hoặc đường dẫn ảnh

  @Prop({ default: Date.now })
  dateUpdate: Date;
}

export const AuthorSchema = SchemaFactory.createForClass(Author);
