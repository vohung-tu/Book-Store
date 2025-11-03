import { Module, forwardRef } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { StoreBranchController } from './store-branch.controller';
import { StoreBranchService } from './store-branch.service';
import { StoreBranch, StoreBranchSchema } from './schemas/store-branch.schema';
import { StoreBranchInventory, StoreBranchInventorySchema } from './schemas/store-branch-inventory.schema';
import { BooksModule } from '../books/books.module'; // import BooksModule

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: StoreBranch.name, schema: StoreBranchSchema },
      { name: StoreBranchInventory.name, schema: StoreBranchInventorySchema },
    ]),
    forwardRef(() => BooksModule), // thêm forwardRef để tránh vòng phụ thuộc
  ],
  controllers: [StoreBranchController],
  providers: [StoreBranchService],
  exports: [StoreBranchService],
})
export class StoreBranchModule {}
