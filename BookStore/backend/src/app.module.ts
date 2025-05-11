import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { BooksModule } from './books/books.module';
import { MongooseModule } from '@nestjs/mongoose';
import { UsersModule } from './users/users.module';
import { OrdersModule } from './order/order/order.module';
import { AdminModule } from './admin/admin.module';
import { ReviewModule } from './review/review.module';

@Module({
  imports: [
    BooksModule,
    MongooseModule.forRoot('mongodb+srv://hungtu:123456%40@bookstorepam.lzrno.mongodb.net/book_store_pam?retryWrites=true&w=majority&appName=BookstorePam'),
    UsersModule,
    OrdersModule,
    AdminModule,
    ReviewModule
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
