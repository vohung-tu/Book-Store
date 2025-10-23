import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { BooksModule } from './books/books.module';
import { MongooseModule } from '@nestjs/mongoose';
import { UsersModule } from './users/users.module';
import { OrdersModule } from './order/order/order.module';
import { AdminModule } from './admin/admin.module';
import { ReviewModule } from './review/review.module';
import { AuthorsModule } from './authors/authors.module';
import { AuthModule } from './users/auth/auth.module';
import { CartModule } from './cart/cart.module';
import { CategoryModule } from './categories/categories.module';
import { ConfigModule } from '@nestjs/config';
import { AiModule } from './ai-helpers/ai.module';
import { CouponsModule } from './coupon/coupon.module';
import { ChatModule } from './chat/chat.module';
import { LoyaltyModule } from './loyalty/loyalty.module';
import { InventoryModule } from './inventory/inventory.module';
import { WarehouseAdminModule } from './inventory/warehouse/warehouse-admin.module';
import { SuppliersModule } from './suppliers/suppliers.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,   // để toàn bộ app dùng được process.env
    }),
    BooksModule,
    MongooseModule.forRoot('mongodb+srv://hungtu:123456%40@bookstorepam.lzrno.mongodb.net/book_store_pam?retryWrites=true&w=majority&appName=BookstorePam'),
    UsersModule,
    AuthModule,
    OrdersModule,
    AdminModule,
    ReviewModule,
    AuthorsModule,
    CartModule,
    CategoryModule,
    AiModule,
    CouponsModule,
    ChatModule,
    LoyaltyModule,
    InventoryModule,
    WarehouseAdminModule,
    SuppliersModule
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
