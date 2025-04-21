import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Book, BookDocument } from './book.schema';
import { Model } from 'mongoose';

@Injectable()
export class BooksService {
    constructor(@InjectModel(Book.name) private bookModel: Model<BookDocument>) {}

    async create(book: Book): Promise<Book> {
        const createdBook = new this.bookModel(book);
        return createdBook.save();
    }

    async findAll(): Promise<Book[]> {
        const books = await this.bookModel.find().lean(); // dùng lean để trả plain object
        return books.map(book => ({
          ...book,
          id: book._id.toString(), // thêm trường id từ _id
        }));
      }
      

    async findOne(id: string): Promise<Book | null> {
        const book = await this.bookModel.findById(id).exec();
        if (!book) {
          throw new NotFoundException(`Book with id ${id} not found`);
        }
        return book;
    }
    
    async update(id: string, updateData: Partial<Book>): Promise<Book | null> {
        return this.bookModel.findByIdAndUpdate(id, updateData, { new: true }).exec();
    }

    async delete(id: string): Promise<void> {
        await this.bookModel.findByIdAndDelete(id).exec();
    }

    async findByCategory(categoryName: string): Promise<Book[]> {
        return this.bookModel.find({ categoryName: categoryName }).exec();
    }
}
