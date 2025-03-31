import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { BooksModule } from './books/books.module';
import { MongooseModule } from '@nestjs/mongoose';
import { UsersModule } from './users/users.module';
import { OrderService } from './order/order/order.service';
import { Order, OrderSchema } from './order/order/order.schema';
import { EmailService } from './order/order/email.service';

@Module({
  imports: [
    BooksModule,
    MongooseModule.forRoot('mongodb+srv://hungtu:123456%40@bookstorepam.lzrno.mongodb.net/book_store_pam?retryWrites=true&w=majority&appName=BookstorePam'),
    UsersModule,
    MongooseModule.forFeature([{ name: Order.name, schema: OrderSchema }])
  ],
  controllers: [AppController],
  providers: [AppService, OrderService, EmailService],
})
export class AppModule {}
