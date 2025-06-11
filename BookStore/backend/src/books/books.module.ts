import { forwardRef, Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { BooksService } from './books.service';
import { BooksController } from './books.controller';
import { Book, BookSchema } from './book.schema';
import { OrdersModule } from 'src/order/order/order.module';
import { Order, OrderSchema } from 'src/order/order/order.schema';
import { Author, AuthorSchema } from 'src/authors/authors.schema';
import { AuthorsModule } from 'src/authors/authors.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Book.name, schema: BookSchema },
      { name: Order.name, schema: OrderSchema }
    ]),
    AuthorsModule,
    forwardRef(() => OrdersModule) // ✅ Tránh vòng lặp phụ thuộc
  ],
  providers: [BooksService],
  controllers: [BooksController],
  exports: [BooksService]
})
export class BooksModule {}
