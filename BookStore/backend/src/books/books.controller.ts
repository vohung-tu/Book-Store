import { Controller, Get, Post, Body, Param, Put, Delete } from '@nestjs/common';
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
    return this.booksService.findAll();
  }

  @Get(':id')
  async findOne(@Param('id') id: string): Promise<Book | null> {
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
}
