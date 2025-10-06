import {
  Controller,
  Get,
  Patch,
  Param,
  Body,
} from '@nestjs/common';
import { LoyaltyService } from './loyalty.service';

@Controller('admin/loyalty')
export class LoyaltyController {
  constructor(private readonly loyaltyService: LoyaltyService) {}

  @Get()
  async getAllCustomers() {
    return this.loyaltyService.getAllCustomers();
  }

  @Patch(':id')
  async updateCustomerLevel(
    @Param('id') id: string,
    @Body('level') level: string,
  ) {
    return this.loyaltyService.updateCustomerLevel(id, level);
  }
}
