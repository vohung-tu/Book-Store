import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ViewHistory, ViewHistorySchema } from './view-history.schema';
import { ViewHistoryService } from './view-history.service';
import { ViewHistoryController } from './view-history.controller';
import { Book, BookSchema } from 'src/books/book.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: ViewHistory.name, schema: ViewHistorySchema },
      { name: Book.name, schema: BookSchema }, 
    ]),
  ],
  controllers: [ViewHistoryController],
  providers: [ViewHistoryService],
  exports: [ViewHistoryService],
})
export class ViewHistoryModule {}
