import { Body, Controller, Get, Param, Post, Query, UploadedFile, UseInterceptors } from "@nestjs/common";
import { FileInterceptor } from '@nestjs/platform-express';
import * as XLSX from 'xlsx';
import { QueryReceiptsDto } from "./dto/query-receipts.dto";
import { InventoryService } from "./inventory.service";
import { CreateImportDto } from "./dto/create-import.dto";
import { CreateExportDto } from "./dto/create-export.dto";
import { InventoryReceiptLean, Paginated } from "./types/inventory.types";

@Controller('inventory')
export class InventoryController {
  constructor(private readonly service: InventoryService) {}

  // =============================
  // 📥 Import kho thủ công
  // =============================
  @Post('import')
  createImport(
    @Body() body: CreateImportDto & { userId: string }
  ): Promise<InventoryReceiptLean> {
    return this.service.createImport(body, body.userId) as Promise<InventoryReceiptLean>;
  }

  // =============================
  // 📤 Xuất kho
  // =============================
  @Post('export')
  createExport(
    @Body() body: CreateExportDto & { userId: string }
  ): Promise<InventoryReceiptLean> {
    return this.service.createExport(body, body.userId) as Promise<InventoryReceiptLean>;
  }

  // =============================
  // 📦 Import Excel
  // =============================
  @Post('import-excel')
  @UseInterceptors(FileInterceptor('file'))
  async importFromExcel(@UploadedFile() file: Express.Multer.File, @Body('userId') userId: string) {
    if (!file) throw new Error('Không có file Excel được tải lên');

    // Đọc dữ liệu từ buffer
    const workbook = XLSX.read(file.buffer, { type: 'buffer' });
    const sheet = workbook.Sheets[workbook.SheetNames[0]];
    const data = XLSX.utils.sheet_to_json(sheet);

    // Gọi service xử lý
    const result = await this.service.importFromExcel(data, userId);
    return { message: 'Import Excel thành công', created: result.length };
  }

  // =============================
  // 📋 Danh sách phiếu
  // =============================
  @Get('receipts')
  list(@Query() q: QueryReceiptsDto): Promise<Paginated<InventoryReceiptLean>> {
    const { type, from, to, q: keyword, page, limit } = q;
    return this.service.listReceipts({
      type,
      from,
      to,
      q: keyword,
      page: page ? Number(page) : 1,
      limit: limit ? Number(limit) : 20,
    }) as Promise<Paginated<InventoryReceiptLean>>;
  }

  // =============================
  // 🔍 Chi tiết phiếu
  // =============================
  @Get('receipts/:id')
  getOne(@Param('id') id: string): Promise<InventoryReceiptLean> {
    return this.service.getOne(id) as Promise<InventoryReceiptLean>;
  }

  @Get('/branches')
  async getBranches() {
    return this.service.getAllBranches();
  }
  
  @Get()
  async getAll() {
    return this.service.findAll();
  }

  // Debug models
  @Get('debug/models')
  debugModels() {
    return {
      receiptModel: {
        modelName: this.service['receiptModel'].modelName,
        collectionName: this.service['receiptModel'].collection.name,
      },
      detailModel: {
        modelName: this.service['detailModel'].modelName,
        collectionName: this.service['detailModel'].collection.name,
      },
      bookModel: {
        modelName: this.service['bookModel'].modelName,
        collectionName: this.service['bookModel'].collection.name,
      },
    };
  }
  
  @Get('book/:id/branches')
  async getBranchStockByBook(@Param('id') id: string) {
    return this.service.getBranchStockByBook(id);
  }
   // =============================
  // 🏬 Xem tồn kho của 1 chi nhánh
  // =============================
  @Get('branch-stock/:branchId')
  async getStockByBranch(@Param('branchId') branchId: string) {
    return this.service.getStockByBranch(branchId);
  }
}
