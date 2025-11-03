import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Put,
  Query,
  InternalServerErrorException,
} from '@nestjs/common';
import { StoreBranchService } from './store-branch.service';

@Controller('store-branches')
export class StoreBranchController {
  constructor(private readonly storeBranchService: StoreBranchService) {}

  @Post()
  async create(@Body() body: any) {
    try {
      return await this.storeBranchService.create(body);
    } catch (err) {
      console.error('❌ Lỗi khi tạo chi nhánh:', err);
      throw new InternalServerErrorException(err.message);
    }
  }

  @Get()
  async findAll() {
    return await this.storeBranchService.findAll();
  }

  @Get(':id')
  async findById(@Param('id') id: string) {
    return await this.storeBranchService.findById(id);
  }

  @Put(':id')
  async update(@Param('id') id: string, @Body() body: any) {
    try {
      return await this.storeBranchService.update(id, body);
    } catch (err) {
      console.error('❌ Lỗi khi cập nhật chi nhánh:', err);
      throw new InternalServerErrorException(err.message);
    }
  }

  @Delete(':id')
  async remove(@Param('id') id: string) {
    try {
      return await this.storeBranchService.remove(id);
    } catch (err) {
      console.error('❌ Lỗi khi xóa chi nhánh:', err);
      throw new InternalServerErrorException(err.message);
    }
  }

  @Get('/available/:bookId')
  async getAvailable(@Param('bookId') bookId: string) {
    return await this.storeBranchService.getAvailableBranches(bookId);
  }

  @Patch('/inventory')
  async updateInventory(@Body() body: { branchId: string; bookId: string; quantity: number }) {
    try {
      return await this.storeBranchService.updateInventory(body.branchId, body.bookId, body.quantity);
    } catch (err) {
      console.error('❌ Lỗi khi cập nhật tồn kho chi nhánh:', err);
      throw new InternalServerErrorException(err.message);
    }
  }

  @Get('/nearest')
  async getNearest(
    @Query('lat') lat: string,
    @Query('lng') lng: string,
    @Query('limit') limit?: string,
  ) {
    return await this.storeBranchService.findNearestBranches(+lat, +lng, +(limit ?? 5));
  }
}
