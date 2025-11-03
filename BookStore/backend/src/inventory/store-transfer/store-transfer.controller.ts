import { Body, Controller, Get, Post } from '@nestjs/common';
import { StoreTransferService } from './store-transfer.service';

@Controller('inventory/store-transfer')
export class StoreTransferController {
  constructor(private readonly storeTransferService: StoreTransferService) {}

  /**
   * 🚚 API tạo phiếu chuyển hàng từ kho đến cửa hàng
   */
  @Post()
  async transferToStore(@Body() dto: any) {
    return this.storeTransferService.transferToStore(dto);
  }

  /**
   * 📋 API lấy danh sách phiếu chuyển
   */
  @Get()
  async getAllTransfers() {
    return this.storeTransferService.getAllTransfers();
  }
}
