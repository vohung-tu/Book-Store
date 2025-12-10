import { Module } from '@nestjs/common';
import { PayOSService } from './payos.service';
import { PayOSController } from './payos.controller';
import { HttpModule } from '@nestjs/axios';

@Module({
  imports: [HttpModule],
  controllers: [PayOSController],
  providers: [PayOSService],
  exports: [PayOSService],
})
export class PayOSModule {}