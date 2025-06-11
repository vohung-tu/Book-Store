import { BadRequestException, Injectable, InternalServerErrorException, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Book, BookDocument } from './book.schema';
import { isValidObjectId, Model, Types } from 'mongoose';
import { Order } from 'src/order/order/order.schema';
import { Author } from 'src/authors/authors.schema';

@Injectable()
export class BooksService {
  constructor(
    @InjectModel(Book.name) private bookModel: Model<BookDocument>,
    @InjectModel(Author.name) private authorModel: Model<Author>,
    @InjectModel(Order.name) private orderModel: Model<Order>
    ) {}

  async create(book: Book): Promise<Book> {
      const createdBook = new this.bookModel(book);
      return createdBook.save();
  }



  async findAllBooks(): Promise<any[]> {
    const books = await this.bookModel.find().lean();

    const authors = await this.authorModel.find().lean(); // lấy toàn bộ authors 1 lần

    const authorMap = new Map(authors.map(a => [a._id.toString(), a.name]));

    return books.map(book => {
      let authorName = 'Không rõ';

      if (typeof book.author === 'object' && book.author !== null && 'name' in book.author) {
        authorName = book.author.name;
      } else if (typeof book.author === 'string') {
        // Nếu là ObjectId dạng string và có trong map
        if (authorMap.has(book.author)) {
          authorName = authorMap.get(book.author) ?? 'Không rõ';
        } else {
          authorName = book.author; // fallback nếu là tên (sai dữ liệu)
        }
      }

      return {
        ...book,
        authorName,
      };
    });
  }


  async findOne(id: string): Promise<Book | null> {
    return this.bookModel.findById(id).populate('author').exec(); // ✅ Tự động lấy dữ liệu tác giả từ DB
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
