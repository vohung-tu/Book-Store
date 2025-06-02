import { forwardRef, Module } from "@nestjs/common";
import { MongooseModule } from "@nestjs/mongoose";
import { Order, OrderSchema } from "./order.schema";
import { OrderController } from "./order.controller";
import { OrderService } from "./order.service";
import { ConfigModule } from '@nestjs/config';
import { VnpayService } from "../payment.service";
import { VnpayController } from "../payment.controller";
import { MailService } from "./email.service";
import { BooksService } from "src/books/books.service";
import { BooksModule } from "src/books/books.module";

@Module({
    imports: [
      ConfigModule,
      MongooseModule.forFeature([{ name: Order.name, schema: OrderSchema }]),
    forwardRef(() => BooksModule)
    ],
    controllers: [OrderController, VnpayController],
    providers: [OrderService, MailService, VnpayService],
    exports: [OrderService],
  })
  export class OrdersModule {}