import { forwardRef, Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { LoyaltyService } from './loyalty.service';
import { LoyaltyController } from './loyalty.controller';
import { User, UserSchema } from 'src/users/user.schema';
import { OrdersModule } from 'src/order/order/order.module';
import { Order, OrderSchema } from 'src/order/order/order.schema';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: User.name, schema: UserSchema },  
      { name: Order.name, schema: OrderSchema }]),
    forwardRef(() => OrdersModule)
  ],
  controllers: [LoyaltyController],
  providers: [LoyaltyService],
  exports: [LoyaltyService]
})
export class LoyaltyModule {}
