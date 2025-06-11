import { Controller, Get, Post, Body, Param, Put, Delete, BadRequestException, Query } from '@nestjs/common';
import { BooksService } from './books.service';
import { Book } from './book.schema';

@Controller('books')
export class BooksController {
  constructor(private readonly booksService: BooksService) {}

  @Post()
  async create(@Body() book: Book): Promise<Book> {
    return this.booksService.create(book);
  }

  @Get()
  async findAll(): Promise<Book[]> {
    return await this.booksService.findAllBooks();
  }

  @Get('search')
  async searchBooks(@Query('keyword') keyword: string): Promise<Book[]> {
    if (!keyword) {
      throw new BadRequestException('Keyword is required');
    }
    return this.booksService.searchBooks(keyword);
  }

  @Get(':id')
  async findOne(@Param('id') id: string): Promise<Book | Book[] | null> { // 🔄 Đổi kiểu trả về thành `Book | Book[] | null`
    if (id === 'best-sellers') {
      return this.booksService.getBestSellers(); // ✅ Gọi API đúng, không ép kiểu
    }

    if (!id.match(/^[0-9a-fA-F]{24}$/)) { 
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

  @Get('category/:categoryName')
  async getProductsByCategory(@Param('categoryName') categoryName: string): Promise<Book[] | null> {
    if (!categoryName) {
      throw new BadRequestException('Category name is required');
    }

    return this.booksService.findByCategory(categoryName);
  }

  @Get('/best-sellers')
  async getBestSellers() {
    return this.booksService.getBestSellers();
  }

}
