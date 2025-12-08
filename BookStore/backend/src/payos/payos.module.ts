import { Module } from '@nestjs/common';
import { PayOSService } from './payos.service';
import { PayOSController } from './payos.controller';

@Module({
  controllers: [PayOSController],
  providers: [PayOSService],
  exports: [PayOSService],
})
export class PayOSModule {}