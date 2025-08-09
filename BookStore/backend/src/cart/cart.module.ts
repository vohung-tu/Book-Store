import { Module } from "@nestjs/common";
import { MongooseModule } from "@nestjs/mongoose";
import { CartItem, CartItemSchema } from "./cart.schema";
import { CartController } from "./cart.controller";
import { CartService } from "./cart.service";

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: CartItem.name, schema: CartItemSchema },
    ]),
  ],
  controllers: [CartController],
  providers: [CartService],
  exports: [CartService],
})
export class CartModule {}