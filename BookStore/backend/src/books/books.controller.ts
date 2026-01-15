import { Controller, Get, Post, Body, Param, Put, Delete, BadRequestException, Query, NotFoundException, InternalServerErrorException } from '@nestjs/common';
import { BooksService } from './books.service';
import { Book } from './book.schema';
import { AiService } from 'src/ai-helpers/ai.service';
import { AlsRecommendService } from './als-recommend.service';
import { Types } from 'mongoose';

@Controller('books')
export class BooksController {
  constructor(private readonly booksService: BooksService,
    private readonly aiService: AiService, 
    private readonly alsService: AlsRecommendService
  ) {}

  @Post()
  create(@Body() book: Book): Promise<Book> {
    return this.booksService.create(book);
  }

  // ✅ ONE endpoint: find all or filter by category with pagination
  @Get()
  async find(
    @Query('category') category?: string,
    @Query('page') page = '1',
    @Query('limit') limit = '20'
  ) {
    const p = Math.max(+page || 1, 1);
    const l = Math.min(+limit || 20, 100);

    return category
      ? this.booksService.findByCategory(category, p, l)
      : this.booksService.findAllBooks(p, l);
  }

  @Get('search')
  async searchBooks(
    @Query('keyword') keyword: string,
    @Query('limit') limit = '24'
  ): Promise<Book[]> {

    if (!keyword?.trim()) {
      return [];
    }

    return this.booksService.searchBooks(
      keyword.trim(),
      Number(limit)
    );
  }

  @Get('best-sellers')
  getBestSellers(
    @Query('limit') limit?: string
  ) {
    const take = Math.max(1, Number(limit) || 10);
    return this.booksService.getBestSellers(take);
  }

  @Get('featured')
  async getFeaturedBooks() {
    return this.booksService.getFeaturedBooks(10); // mặc định trả 10 sách
  }

  @Get('new-releases')
  async getNewReleases() {
    return this.booksService.getNewReleases(10);
  }

  @Get('incoming')
  async getIncoming() {
    return this.booksService.getIncomingReleases(10);
  }

  @Get('reference')
  async getReferenceBooks() {
    return this.booksService.getReferenceBooks();
  }

  @Get('recommend')
  async getRecommendedBooks() {
    return this.booksService.getRecommendedBooks();
  }

  @Get('halloween')
  async getHalloweenBooks() {
    return this.booksService.getHalloweenBooks();
  }
  
  @Get('list')
  async adminList(
    @Query('page') page = 1,
    @Query('limit') limit = 20,
    @Query('search') search = ''
  ) {
    return this.booksService.findAdminList(+page, +limit, search);
  }

  @Get("generate-embeddings")
  async generateAllEmbeddings() {
    return this.booksService.generateEmbeddingsForAll();
  }

  @Get("related-ai/:id")
  async getRelatedAI(@Param("id") id: string) {
    return this.booksService.getRelatedBooks(id);
  }

  //using als implicit embedding 
  @Get('related-als/:id') 
  async getRelatedAls(@Param('id') id: string) { 
    return this.alsService.relatedBooks(id, 6); 
  }

  @Get("recommend-user/:userId")
  async getUserRecommend(@Param("userId") userId: string) {
    return this.alsService.recommendForUser(userId, 6);
  }

  @Get(':id')
  async findOne(@Param('id') id: string): Promise<Book | null> {
    // giữ đặc biệt nếu bạn có thêm slug khác thì xử lý trước ở đây
    if (!/^[0-9a-fA-F]{24}$/.test(id)) {
      throw new BadRequestException('ID sách không hợp lệ!');
    }
    return this.booksService.findOne(id);
  }

  @Get('admin/:id')
  async findAdminDetail(@Param('id') id: string) {
    if (!Types.ObjectId.isValid(id)) {
      throw new BadRequestException('ID không hợp lệ');
    }

    return this.booksService.findAdminDetail(id);
  }

  @Put(':id')
  async update(@Param('id') id: string, @Body() updateData: Partial<Book>): Promise<Book | null> {
    return this.booksService.update(id, updateData);
  }

  @Delete(':id')
  async delete(@Param('id') id: string): Promise<void> {
    return this.booksService.delete(id);
  }

  @Post(':id/summary-ai')
  async generateSummary(@Param('id') id: string) {
    const book = await this.booksService.findOne(id);

    if (!book) throw new NotFoundException('Book not found');
    if (!book.title) throw new BadRequestException('Book title is missing');

    // ✅ Chỉ generate, không lưu
    const summary = await this.aiService.generateSummary(book.title, book.description);

    return { summary_ai: summary };
  }


  @Get(':id/summary-ai')
  async getSummary(@Param('id') id: string) {
    const book = await this.booksService.findOne(id);
    if (!book) throw new NotFoundException('Book not found');
    return { summary_ai: book.summary_ai || 'Chưa có tóm tắt' };
  }

  @Get('lite/transfer')
  findForTransfer(
    @Query('search') search = ''
  ) {
    return this.booksService.findForTransfer(search);
  }

  @Get('lite/by-code/:code')
  findLiteByCode(@Param('code') code: string) {
    return this.booksService.findLiteByCode(code);
  }

}
