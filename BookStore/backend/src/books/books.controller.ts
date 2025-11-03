import { Controller, Get, Post, Body, Param, Put, Delete, BadRequestException, Query, NotFoundException, InternalServerErrorException } from '@nestjs/common';
import { BooksService } from './books.service';
import { Book } from './book.schema';
import { AiService } from 'src/ai-helpers/ai.service';

@Controller('books')
export class BooksController {
  constructor(private readonly booksService: BooksService,
    private readonly aiService: AiService
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
  async searchBooks(@Query('keyword') keyword: string): Promise<Book[]> {
    if (!keyword) throw new BadRequestException('Keyword is required');
    return this.booksService.searchBooks(keyword);
  }

  @Get('best-sellers')
  getBestSellers() {
    return this.booksService.getBestSellers();
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
  
  @Get('detailed')
  async findAllDetailed() {
    return this.booksService.findAllDetailed();
  }

  @Get(':id')
  async findOne(@Param('id') id: string): Promise<Book | null> {
    // giữ đặc biệt nếu bạn có thêm slug khác thì xử lý trước ở đây
    if (!/^[0-9a-fA-F]{24}$/.test(id)) {
      throw new BadRequestException('ID sách không hợp lệ!');
    }
    return this.booksService.findOne(id);
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


}
