import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { WarehouseAdminService } from './warehouse-admin.service';
import { WarehouseAdminController } from './warehouse-admin.controller';
import { WarehouseAdmin, WarehouseAdminSchema } from '../schemas/warehouse-admin.schema';

@Module({
  imports: [MongooseModule.forFeature([{ name: WarehouseAdmin.name, schema: WarehouseAdminSchema }])],
  controllers: [WarehouseAdminController],
  providers: [WarehouseAdminService],
  exports: [MongooseModule]
})
export class WarehouseAdminModule {}
