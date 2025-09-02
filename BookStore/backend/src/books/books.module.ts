import { forwardRef, Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { BooksService } from './books.service';
import { BooksController } from './books.controller';
import { Book, BookSchema } from './book.schema';
import { OrdersModule } from 'src/order/order/order.module';
import { Order, OrderSchema } from 'src/order/order/order.schema';
import { AuthorsModule } from 'src/authors/authors.module';
import { CategoryModule } from 'src/categories/categories.module';
import { Category, CategorySchema } from 'src/categories/categories.schema';
import { AiService } from 'src/ai-helpers/ai.service';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Book.name, schema: BookSchema },
      { name: Order.name, schema: OrderSchema },
      { name: Category.name, schema: CategorySchema },
    ]),
    AuthorsModule,
    CategoryModule,
    forwardRef(() => OrdersModule) // ✅ Tránh vòng lặp phụ thuộc
  ],
  providers: [BooksService, AiService],
  controllers: [BooksController],
  exports: [BooksService]
})
export class BooksModule {}
