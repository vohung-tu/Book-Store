import { Body, Controller, Delete, Get, Param, Post, Put } from '@nestjs/common';
import { WarehouseAdminService } from './warehouse-admin.service';

@Controller('warehouse-admin')
export class WarehouseAdminController {
  constructor(private readonly service: WarehouseAdminService) {}

  @Get()
  findAll() {
    return this.service.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.service.findOne(id);
  }

  @Post()
  create(@Body() body: any) {
    return this.service.create(body);
  }

  @Put(':id')
  update(@Param('id') id: string, @Body() body: any) {
    return this.service.update(id, body);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.service.remove(id);
  }
}
