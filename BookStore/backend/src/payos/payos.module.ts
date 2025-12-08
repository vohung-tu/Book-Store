import { Module } from '@nestjs/common';
import { PayOSService } from './payos.service';
import { PayOSController } from './payos.controller';
import { HttpModule } from '@nestjs/axios';
import { ConfigModule } from '@nestjs/config';
import { OrdersModule } from 'src/order/order/order.module';

@Module({
  imports: [HttpModule, ConfigModule],
  controllers: [PayOSController],
  providers: [PayOSService],
  exports: [PayOSService],
})
export class PayOSModule {}