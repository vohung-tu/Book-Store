import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { InventoryController } from './inventory.controller';
import { InventoryService } from './inventory.service';
import { InventoryReceipt, InventoryReceiptSchema } from './schemas/inventory-receipt.schema';
import { InventoryReceiptDetail, InventoryReceiptDetailSchema } from './schemas/inventory-receipt-detail.schema';
import { Book, BookSchema } from 'src/books/book.schema';
import { Branch, BranchSchema, Inventory, InventorySchema } from './schemas/inventory-branch.schema';
import { WarehouseAdminModule } from './warehouse/warehouse-admin.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: InventoryReceipt.name, schema: InventoryReceiptSchema },
      { name: InventoryReceiptDetail.name, schema: InventoryReceiptDetailSchema },
      { name: Branch.name, schema: BranchSchema },
      { name: Inventory.name, schema: InventorySchema },
      { name: Book.name, schema: BookSchema },
    ]),
    WarehouseAdminModule,
  ],
  controllers: [InventoryController],
  providers: [InventoryService],
})
export class InventoryModule {}
