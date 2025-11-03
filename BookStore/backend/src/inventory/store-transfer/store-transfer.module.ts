import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { StoreTransferReceipt, StoreTransferReceiptSchema } from '../schemas/store-transfer.schema';
import { StoreTransferService } from './store-transfer.service';
import { StoreTransferController } from './store-transfer.controller';
import { WarehouseAdmin, WarehouseAdminSchema } from '../schemas/warehouse-admin.schema';
import { StoreBranchInventory, StoreBranchInventorySchema } from 'src/store-branch/schemas/store-branch-inventory.schema';
import { StoreBranch, StoreBranchSchema } from 'src/store-branch/schemas/store-branch.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: StoreTransferReceipt.name, schema: StoreTransferReceiptSchema },
      { name: StoreBranchInventory.name, schema: StoreBranchInventorySchema },
      { name: WarehouseAdmin.name, schema: WarehouseAdminSchema },
      { name: StoreBranch.name, schema: StoreBranchSchema },
    ]),
  ],
  providers: [StoreTransferService],
  controllers: [StoreTransferController],
})
export class StoreTransferModule {}
