import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type UserDocument = User & Document;

@Schema({ timestamps: true }) // Tự động tạo `createdAt` và `updatedAt`
export class User {
  @Prop({ required: true, unique: true })
  email: string;

  @Prop({ required: true })
  full_name: string;

  @Prop({ required: true })
  password: string;

  @Prop()
  birth: Date; 

  @Prop()
  address?: string;

  @Prop({ required: true, unique: true })
  username: string;

  @Prop()
  phone_number: string;
}

export const UserSchema = SchemaFactory.createForClass(User);
