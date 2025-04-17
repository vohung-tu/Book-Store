import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type UserDocument = User & Document;

@Schema({ timestamps: true }) 
export class User {
  @Prop({ required: true, unique: true })
  email: string;

  @Prop({ required: true })
  full_name: string;

  @Prop({ required: true })
  password: string;

  @Prop()
  birth: Date;

  @Prop({ default: 'admin' })
  role: string;

  @Prop({
    type: [
      {
        value: { type: String, required: true },
        isDefault: { type: Boolean, default: false }
      }
    ],
    default: []
  })
  address: { value: string; isDefault: boolean }[];
  
  @Prop({ required: true, unique: true })
  username: string;

  @Prop()
  phone_number: string;

  @Prop()
  note?: string;

  @Prop()
  payment: string;

}

export const UserSchema = SchemaFactory.createForClass(User);
