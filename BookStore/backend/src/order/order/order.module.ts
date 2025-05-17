import { Module } from "@nestjs/common";
import { MongooseModule } from "@nestjs/mongoose";
import { Order, OrderSchema } from "./order.schema";
import { OrderController } from "./order.controller";
import { OrderService } from "./order.service";
import { EmailService } from "./email.service";
import { ConfigModule } from '@nestjs/config';
import { VnpayService } from "../payment.service";
import { VnpayController } from "../payment.controller";

@Module({
    imports: [
      ConfigModule,
      MongooseModule.forFeature([{ name: Order.name, schema: OrderSchema }]),
    ],
    controllers: [OrderController, VnpayController],
    providers: [OrderService, EmailService, VnpayService],
  })
  export class OrdersModule {}