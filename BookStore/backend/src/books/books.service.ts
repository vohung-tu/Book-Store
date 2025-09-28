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
    if (book.description) {
      const summary = await this.aiService.generateSummary(book.title);
      (book as any).summary_ai = summary;
    }
    const createdBook = new this.bookModel(book);
    return createdBook.save();
  }

  async findAllBooks(
    page = 1,
    limit = 20
  ): Promise<{ items: any[]; total: number; page: number; pages: number }> {
    const skip = (page - 1) * limit;

    // ✅ Chỉ lấy các field cần thiết để render homepage
    const projection = {
      title: 1,
      author: 1,
      price: 1,
      flashsale_price: 1,
      discount_percent: 1,
      coverImage: 1,
      publishedDate: 1,
      categoryName: 1,
      quantity: 1,
      sold: 1,
    };

    // ✅ Dùng index sort theo createdAt để Mongo không full collection scan
    const [books, total] = await Promise.all([
      this.bookModel
        .find({}, projection)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      this.bookModel.countDocuments(),
    ]);

    // ✅ Map author name 1 lần
    const authors = await this.authorModel.find({}, { name: 1 }).lean();
    const authorMap = new Map(authors.map((a) => [a._id.toString(), a.name]));

    const items = books.map((book) => {
      let authorName = 'Không rõ';

      if (typeof book.author === 'object' && book.author !== null && 'name' in book.author) {
        authorName = (book.author as any).name;
      } else if (typeof book.author === 'string') {
        authorName = authorMap.get(book.author) ?? 'Không rõ';
      }

      return {
        ...book,
        authorName,
        sold: book.sold || 0,
      };
    });

    return {
      items,
      total,
      page,
      pages: Math.ceil(total / limit),
    };
  }

  async getFeaturedBooks(limit = 10) {
    // ✅ Lấy danh sách sách mới nhất (chỉ field cần thiết)
    const projection = {
      title: 1,
      author: 1,
      price: 1,
      flashsale_price: 1,
      discount_percent: 1,
      coverImage: 1,
      publishedDate: 1,
      categoryName: 1
    };

    const books = await this.bookModel
      .find({}, projection)
      .sort({ createdAt: -1 }) // lấy sách mới trước, lát nữa sẽ sort lại theo sold
      .limit(limit * 2) // lấy dư ra để sau khi sort vẫn đủ số lượng
      .lean();

    // ✅ Map tên tác giả chỉ một lần
    const authors = await this.authorModel.find({}, { name: 1 }).lean();
    const authorMap = new Map(authors.map(a => [a._id.toString(), a.name]));

    // ✅ Lấy tổng số đã bán từ orders
    const soldStats = await this.orderModel.aggregate([
      { $unwind: "$products" },
      {
        $group: {
          _id: "$products._id",
          totalSold: { $sum: "$products.quantity" }
        }
      }
    ]);
    const soldMap = new Map(soldStats.map(s => [s._id.toString(), s.totalSold]));

    // ✅ Ghép sold + authorName vào books
    const booksWithSold = books.map(book => ({
      ...book,
      authorName:
        typeof book.author === "object" && book.author !== null && "name" in book.author
          ? (book.author as any).name
          : authorMap.get(book.author as any) ?? "Không rõ",
      sold: soldMap.get(book._id.toString()) ?? 0
    }));

    // ✅ Sort giảm dần theo sold
    const sortedBooks = booksWithSold.sort((a, b) => (b.sold ?? 0) - (a.sold ?? 0));

    // ✅ Trả về top N
    return sortedBooks.slice(0, limit);
  }

  async updateSummary(id: string, summary: string): Promise<Book> {
    try {
      const book = await this.bookModel.findByIdAndUpdate(
        id,
        { $set: { summary_ai: summary } }, // ✅ thêm field summary_ai
        { new: true } // trả về document đã cập nhật
      ).exec();

      if (!book) {
        throw new NotFoundException(`Book với ID ${id} không tồn tại`);
      }

      return book;
    } catch (err) {
      console.error('❌ updateSummary error:', err);
      throw new InternalServerErrorException('Không thể cập nhật summary_ai cho sách');
    }
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

  private bestSellerCache: { data: any[]; expires: number } | null = null;

  async getBestSellers(limit = 10) {
    const now = Date.now();
    if (this.bestSellerCache && this.bestSellerCache.expires > now) {
      return this.bestSellerCache.data;
    }

    const bestSellers = await this.orderModel.aggregate([
      { $unwind: "$products" },
      { $group: { _id: "$products._id", totalSold: { $sum: "$products.quantity" } } },
      { $sort: { totalSold: -1 } },
      { $limit: limit }
    ]);

    const soldMap = new Map(bestSellers.map(b => [b._id.toString(), b.totalSold]));

    const books = await this.bookModel.find(
      { _id: { $in: Array.from(soldMap.keys()) } },
      { title: 1, coverImage: 1, price: 1, flashsale_price: 1, discount_percent: 1, sold: 1 }
    ).lean();

    const result = books.map(b => ({
      ...b,
      sold: soldMap.get(b._id.toString()) || b.sold || 0
    }));

    // ✅ cache trong 60 giây
    this.bestSellerCache = { data: result, expires: now + 60_000 };

    return result;
  }

// sách mới ra
  async getNewReleases(limit = 10) {
    const today = new Date();
    const ninetyDaysAgo = new Date(today.getTime() - 90 * 24 * 60 * 60 * 1000);

    const projection = {
      title: 1,
      coverImage: 1,
      price: 1,
      flashsale_price: 1,
      discount_percent: 1,
      publishedDate: 1,
      sold: 1,
      categoryName: 1,
    };

    return this.bookModel
      .find({ publishedDate: { $gte: ninetyDaysAgo, $lte: today } }, projection)
      .sort({ publishedDate: -1 })
      .limit(limit)
      .lean();
  }

  // sách sắp ra mắt

  async getIncomingReleases(limit = 10) {
    const today = new Date();
    const next90Days = new Date(today.getTime() + 90 * 24 * 60 * 60 * 1000);

    const projection = {
      title: 1,
      coverImage: 1,
      price: 1,
      flashsale_price: 1,
      discount_percent: 1,
      publishedDate: 1,
      sold: 1,
      categoryName: 1,
    };

    return this.bookModel
      .find({ publishedDate: { $gt: today, $lte: next90Days } }, projection)
      .sort({ publishedDate: 1 }) // sắp xếp ngày gần nhất lên đầu
      .limit(limit)
      .lean();
  }

  //reference book
  async getReferenceBooks() {
    const parentSlugs = ['sach-tham-khao', 'sach-trong-nuoc'];
    const categories = await this.categoryModel.find({ slug: { $in: parentSlugs } }).lean();

    // Lấy luôn slug của children nếu có
    const childSlugs = await Promise.all(
      categories.map(c => this.getAllChildrenSlugs(c._id.toString()))
    );
    const allSlugs = [...parentSlugs, ...childSlugs.flat()];

    const books = await this.bookModel
      .find({ categoryName: { $in: allSlugs } }, {
        title: 1,
        coverImage: 1,
        price: 1,
        flashsale_price: 1,
        discount_percent: 1,
        categoryName: 1,
      })
      .lean();

    return {
      sachThamKhao: books.filter((b) => b.categoryName === 'sach-tham-khao' || /* children condition */ allSlugs.includes(b.categoryName)),
      sachTrongNuoc: books.filter((b) => b.categoryName === 'sach-trong-nuoc' || allSlugs.includes(b.categoryName)),
    };
  }


}
