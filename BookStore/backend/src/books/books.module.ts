import { forwardRef, Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { BooksService } from './books.service';
import { BooksController } from './books.controller';
import { Book, BookSchema } from './book.schema';
import { OrdersModule } from 'src/order/order/order.module';
import { Order, OrderSchema } from 'src/order/order/order.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Book.name, schema: BookSchema },
      { name: Order.name, schema: OrderSchema }
    ]),
    forwardRef(() => OrdersModule) // ✅ Tránh vòng lặp phụ thuộc
  ],
  providers: [BooksService],
  controllers: [BooksController],
  exports: [BooksService]
})
export class BooksModule {}
