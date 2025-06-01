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
  resetPasswordToken?: string;

  @Prop()
  resetPasswordExpires?: Date;


  @Prop()
  birth: Date;

  @Prop({ default: 'admin' })
  role: string;

  @Prop({
    type: [
      {
        value:     { type: String,  required: true },
        isDefault: { type: Boolean, default: false },
        fullName:  { type: String },    // ← thêm
        phoneNumber: { type: Number }   // ← thêm
      }
    ],
    default: []
  })
  address: Array<{
    value: string;
    isDefault: boolean;
    fullName?: string;
    phoneNumber?: number;
  }>;
  
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
