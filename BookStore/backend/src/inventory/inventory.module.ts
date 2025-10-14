import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { InventoryController } from './inventory.controller';
import { InventoryService } from './inventory.service';
import { InventoryReceipt, InventoryReceiptSchema } from './schemas/inventory-receipt.schema';
import { InventoryReceiptDetail, InventoryReceiptDetailSchema } from './schemas/inventory-receipt-detail.schema';
import { Book, BookSchema } from 'src/books/book.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: InventoryReceipt.name, schema: InventoryReceiptSchema },
      { name: InventoryReceiptDetail.name, schema: InventoryReceiptDetailSchema },
      { name: Book.name, schema: BookSchema },
    ]),
  ],
  controllers: [InventoryController],
  providers: [InventoryService],
})
export class InventoryModule {}
