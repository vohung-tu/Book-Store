import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Book, BookDocument } from './book.schema';
import { Model, Types } from 'mongoose';
import { Order } from 'src/order/order/order.schema';

@Injectable()
export class BooksService {
  constructor(
    @InjectModel(Book.name) private bookModel: Model<BookDocument>,
    @InjectModel(Order.name) private orderModel: Model<Order>
    ) {}

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

  async searchBooks(keyword: string): Promise<Book[]> {
    return this.bookModel.find({
      title: { $regex: keyword, $options: 'i' }
    }).exec();
  }
  
  async updateStock(bookId: string, quantitySold: number): Promise<Book> {
    const book = await this.bookModel.findOne({ _id: new Types.ObjectId(bookId) }); // 🔄 Chuyển đổi ID

    if (!book) {
        throw new NotFoundException(`Sách với ID ${bookId} không tồn tại!`);
    }

    if (book.quantity < quantitySold) {
        throw new BadRequestException('Số lượng tồn kho không đủ!');
    }
    book.quantity -= quantitySold;
    await book.save();
    return book;
}

  async getBestSellers(): Promise<Book[]> {
    const bestSellers = await this.orderModel.aggregate([
      { $unwind: "$products" }, // Tách từng sản phẩm trong đơn hàng
      { $group: { _id: "$products._id", totalSold: { $sum: "$products.quantity" } } }, // Tính tổng số lượng bán
      { $sort: { totalSold: -1 } }, // Sắp xếp theo số lượng bán giảm dần
      { $limit: 10 } // Hiển thị tối đa 10 sản phẩm
    ]);

    const bookIds = bestSellers.map(item => item._id);
    return this.bookModel.find({ _id: { $in: bookIds } }).exec();
  }
}
