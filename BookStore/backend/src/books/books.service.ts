import { BadRequestException, Injectable, InternalServerErrorException, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Book, BookDocument } from './book.schema';
import { Model, Types } from 'mongoose';
import { Order } from 'src/order/order/order.schema';
import { Author } from 'src/authors/authors.schema';
import { Category, CategoryDocument } from 'src/categories/categories.schema';
import { AiService } from 'src/ai-helpers/ai.service';

@Injectable()
export class BooksService {
  constructor(
    @InjectModel(Book.name) private bookModel: Model<BookDocument>,
    @InjectModel(Author.name) private authorModel: Model<Author>,
    @InjectModel(Order.name) private orderModel: Model<Order>,
    @InjectModel(Category.name) private categoryModel: Model<CategoryDocument>,
    private aiService: AiService
    ) {}

  async create(book: Book): Promise<Book> {
      const createdBook = new this.bookModel(book);
      // 🔥 Gọi AI để sinh summary
      if (book.description) {
        const summary = await this.aiService.generateSummary(book.title, book.description);
        book.summary_ai = summary;
      }
      return createdBook.save();
  }

  async findAllBooks(page = 1, limit = 20): Promise<{items:any[]; total:number; page:number; pages:number}> {
    const skip = (page - 1) * limit;

    // lấy sách + tổng song song
    const [books, total] = await Promise.all([
      this.bookModel.find().sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
      this.bookModel.countDocuments()
    ]);

    // lấy toàn bộ authors 1 lần và map như bạn đang làm
    const authors = await this.authorModel.find().lean();
    const authorMap = new Map(authors.map(a => [a._id.toString(), a.name]));

    const items = books.map(book => {
      let authorName = 'Không rõ';

      if (typeof book.author === 'object' && book.author !== null && 'name' in book.author) {
        authorName = (book.author as any).name;
      } else if (typeof book.author === 'string') {
        authorName = authorMap.get(book.author) ?? book.author ?? 'Không rõ';
      }

      return { ...book, authorName, sold: book.sold || 0 };
    });

    return { items, total, page, pages: Math.ceil(total / limit) };
  }

  async updateSummary(id: string, summary: string) {
    return this.bookModel.findByIdAndUpdate(
      id,
      { summary_ai: summary },
      { new: true }
    ).lean();
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

  async getAllChildrenSlugs(parentId: string): Promise<string[]> {
    const children = await this.categoryModel.find({ parentId }).lean();
    let result: string[] = [];
    for (const child of children) {
      result.push(child.slug);
      const subSlugs = await this.getAllChildrenSlugs(child._id.toString());
      result = result.concat(subSlugs);
    }
    return result;
  }

  async findByCategory(categorySlug: string, page = 1, limit = 20) {
    const skip = (page - 1) * limit;

    // 🔎 Tìm category gốc từ slug
    const parent = await this.categoryModel.findOne({ slug: categorySlug }).lean();
    if (!parent) {
      return { items: [], total: 0, page, pages: 0 };
    }

    // 🔎 Lấy toàn bộ children (con + cháu)
    const collectChildren = async (parentId: string): Promise<string[]> => {
      const children = await this.categoryModel.find({ parentId }).lean();
      let ids = children.map(c => c.slug); // hoặc c._id
      for (const child of children) {
        ids = ids.concat(await collectChildren(child._id.toString()));
      }
      return ids;
    };

    const allSlugs = [parent.slug, ...(await collectChildren(parent._id.toString()))];

    // 🔎 Query tất cả sách thuộc 1 trong các slug
    const q = { categoryName: { $in: allSlugs } };

    const [books, total] = await Promise.all([
      this.bookModel
        .find(q)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      this.bookModel.countDocuments(q),
    ]);

    // map authorName
    const authors = await this.authorModel.find().lean();
    const authorMap = new Map(authors.map(a => [a._id.toString(), a.name]));
    const items = books.map(book => ({
      ...book,
      authorName:
        typeof book.author === 'object' && book.author && 'name' in (book.author as any)
          ? (book.author as any).name
          : authorMap.get(book.author as any) ?? 'Không rõ',
    }));

    return { items, total, page, pages: Math.ceil(total / limit) };
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

    book.sold = (book.sold || 0) + quantitySold;
    await book.save();
    return book;
  }

  async getBestSellers(limit = 10) {
    const bestSellers = await this.orderModel.aggregate([
      { $unwind: "$products" },
      { 
        $group: { 
          _id: "$products._id", 
          totalSold: { $sum: "$products.quantity" } 
        } 
      },
      { $sort: { totalSold: -1 } },
      { $limit: limit }
    ]);

    // Map thành dictionary để merge
    const soldMap = new Map(bestSellers.map(b => [b._id.toString(), b.totalSold]));

    const books = await this.bookModel.find({ _id: { $in: Array.from(soldMap.keys()) } }).lean();

    return books.map(b => ({
      ...b,
      sold: soldMap.get(b._id.toString()) || b.sold || 0
    }));
  }


}
