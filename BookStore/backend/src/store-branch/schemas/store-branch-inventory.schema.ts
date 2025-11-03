import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema } from 'mongoose';
import { StoreBranch } from './store-branch.schema';
import { Book } from 'src/books/book.schema';

@Schema({ timestamps: true })
export class StoreBranchInventory extends Document {
  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'StoreBranch', required: true })
  storeBranch: StoreBranch;

  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'Book', required: true })
  book: Book;

  @Prop({ required: true, default: 0 })
  quantity: number;
}

export const StoreBranchInventorySchema = SchemaFactory.createForClass(StoreBranchInventory);
