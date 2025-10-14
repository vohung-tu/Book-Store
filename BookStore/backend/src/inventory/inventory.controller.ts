import { Body, Controller, Get, Param, Post, Query } from "@nestjs/common";
import { QueryReceiptsDto } from "./dto/query-receipts.dto";
import { InventoryService } from "./inventory.service";
import { CreateImportDto } from "./dto/create-import.dto";
import { CreateExportDto } from "./dto/create-export.dto";
import { InventoryReceiptLean, Paginated } from "./types/inventory.types";


@Controller('inventory')
export class InventoryController {
  constructor(private readonly service: InventoryService) {}

  @Post('import')
  createImport(
    @Body() body: CreateImportDto & { userId: string }
  ): Promise<InventoryReceiptLean> {
    return this.service.createImport(body, body.userId) as Promise<InventoryReceiptLean>;
  }

  @Post('export')
  createExport(
    @Body() body: CreateExportDto & { userId: string }
  ): Promise<InventoryReceiptLean> {
    return this.service.createExport(body, body.userId) as Promise<InventoryReceiptLean>;
  }

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

  @Get('receipts/:id')
  getOne(@Param('id') id: string): Promise<InventoryReceiptLean> {
    return this.service.getOne(id) as Promise<InventoryReceiptLean>;
  }

  @Get()
  async getAll() {
    return this.service.findAll();
  }

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
}
