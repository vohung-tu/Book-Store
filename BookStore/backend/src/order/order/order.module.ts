import { forwardRef, Module } from "@nestjs/common";
import { MongooseModule } from "@nestjs/mongoose";
import { Order, OrderSchema } from "./order.schema";
import { OrderController } from "./order.controller";
import { OrderService } from "./order.service";
import { ConfigModule } from '@nestjs/config';
import { VnpayService } from "../payment.service";
import { VnpayController } from "../payment.controller";
import { MailService } from "./email.service";
import { BooksModule } from "src/books/books.module";
import { LoyaltyModule } from "src/loyalty/loyalty.module";
import { InventoryModule } from "src/inventory/inventory.module";

@Module({
    imports: [
      ConfigModule,
      forwardRef(() => LoyaltyModule),
      InventoryModule,
      MongooseModule.forFeature([{ name: Order.name, schema: OrderSchema }]),
    forwardRef(() => BooksModule)
    ],
    controllers: [OrderController, VnpayController],
    providers: [OrderService, MailService, VnpayService],
    exports: [OrderService],
  })
  export class OrdersModule {}