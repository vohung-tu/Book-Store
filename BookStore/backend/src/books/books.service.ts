import { BadRequestException, Injectable, InternalServerErrorException, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Book, BookDocument } from './book.schema';
import { ClientSession, Model, Types } from 'mongoose';
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

    // đảm bảo images tồn tại
    if (!book.images) {
      (book as any).images = [];
    }

    const createdBook = new this.bookModel(book);
    return createdBook.save();
  }

  private async attachAuthorName(books: any[]): Promise<any[]> {
    const authors = await this.authorModel.find({}, { name: 1 }).lean();
    const authorMap = new Map(authors.map(a => [a._id.toString(), a.name]));

    return books.map(book => ({
      ...book,
      authorName:
        typeof book.author === "object" && book.author !== null && "name" in book.author
          ? (book.author as any).name
          : authorMap.get(book.author?.toString?.()) ?? "Không rõ"
    }));
  }

  async findAllBooks(page = 1, limit = 20) {
    const skip = (page - 1) * limit;

    const projection = {
      title: 1,
      author: 1,
      price: 1,
      flashsale_price: 1,
      discount_percent: 1,
      coverImage: 1,
      images: 1,
      description: 1,
      publishedDate: 1,
      categoryName: 1,
      quantity: 1,
      sold: 1,
    };

    const [books, total, soldStats] = await Promise.all([
      this.bookModel.find({}, projection).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
      this.bookModel.countDocuments(),
      this.orderModel.aggregate([
        { $unwind: "$products" },
        { $group: { _id: "$products._id", totalSold: { $sum: "$products.quantity" } } }
      ])
    ]);

    const soldMap = new Map(soldStats.map(s => [s._id.toString(), s.totalSold]));

    let items = books.map(b => ({
      ...b,
      sold: soldMap.get(b._id.toString()) ?? 0
    }));

    // ✅ Gắn thêm authorName
    items = await this.attachAuthorName(items);

    return { items, total, page, pages: Math.ceil(total / limit) };
  }

  async getFeaturedBooks(limit = 10) {
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
      .sort({ createdAt: -1 })
      .limit(limit * 2)
      .lean();

    // sold
    const soldStats = await this.orderModel.aggregate([
      { $unwind: "$products" },
      { $group: { _id: "$products._id", totalSold: { $sum: "$products.quantity" } } }
    ]);
    const soldMap = new Map(soldStats.map(s => [s._id.toString(), s.totalSold]));

    let booksWithSold = books.map(book => ({
      ...book,
      sold: soldMap.get(book._id.toString()) ?? 0
    }));

    // ✅ map authorName
    booksWithSold = await this.attachAuthorName(booksWithSold);

    return booksWithSold.sort((a, b) => (b.sold ?? 0) - (a.sold ?? 0)).slice(0, limit);
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

  async searchBooks(keyword: string): Promise<Book[]> {
    return this.bookModel.find({
      title: { $regex: keyword, $options: 'i' }
    }).exec();
  }
  
  async updateStock(bookId: string, quantitySold: number): Promise<void> {
    const res = await this.bookModel.updateOne(
      { _id: bookId, quantity: { $gte: quantitySold } },
      { 
        $inc: { quantity: -quantitySold, sold: quantitySold } 
      }
    );

    if (res.matchedCount === 0) {
      const exists = await this.bookModel.exists({ _id: bookId });
      if (!exists) throw new NotFoundException(`Sách với ID ${bookId} không tồn tại!`);
      throw new BadRequestException('Số lượng tồn kho không đủ!');
    }
  }

  async getBestSellers(limit = 10) {
    const bestSellers = await this.orderModel.aggregate([
      { $unwind: "$products" },
      { $group: { _id: "$products._id", totalSold: { $sum: "$products.quantity" } } },
      { $sort: { totalSold: -1 } },
      { $limit: limit }
    ]);

    const soldMap = new Map(bestSellers.map(b => [b._id.toString(), b.totalSold]));

    let books = await this.bookModel.find(
      { _id: { $in: Array.from(soldMap.keys()) } },
      { title: 1, author: 1, coverImage: 1, price: 1, flashsale_price: 1, discount_percent: 1, sold: 1 }
    ).lean();

    books = books.map(b => ({
      ...b,
      sold: soldMap.get(b._id.toString()) || b.sold || 0
    }));

    // ✅ map authorName
    books = await this.attachAuthorName(books);

    return books;
  }

// sách mới ra
  async getNewReleases(limit = 10) {
    const today = new Date();
    const ninetyDaysAgo = new Date(today.getTime() - 90 * 24 * 60 * 60 * 1000);

    const books = await this.bookModel
      .find({ publishedDate: { $gte: ninetyDaysAgo, $lte: today } }, {
        title: 1,
        author: 1,
        coverImage: 1,
        price: 1,
        flashsale_price: 1,
        discount_percent: 1,
        publishedDate: 1,
        categoryName: 1,
        sold: 1
      })
      .sort({ publishedDate: -1 })
      .limit(limit)
      .lean();

    return this.attachAuthorName(books);
  }

  async getIncomingReleases(limit = 10) {
    const today = new Date();
    const next90Days = new Date(today.getTime() + 90 * 24 * 60 * 60 * 1000);

    const books = await this.bookModel
      .find({ publishedDate: { $gt: today, $lte: next90Days } }, {
        title: 1,
        author: 1,
        coverImage: 1,
        price: 1,
        flashsale_price: 1,
        discount_percent: 1,
        publishedDate: 1,
        categoryName: 1,
      })
      .sort({ publishedDate: 1 })
      .limit(limit)
      .lean();

    return this.attachAuthorName(books);
  }

  async findByCategory(categorySlug: string, page = 1, limit = 20) {
    const skip = (page - 1) * limit;
    const parent = await this.categoryModel.findOne({ slug: categorySlug }).lean();
    if (!parent) return { items: [], total: 0, page, pages: 0 };

    const collectChildren = async (parentId: string): Promise<string[]> => {
      const children = await this.categoryModel.find({ parentId }).lean();
      let ids = children.map(c => c.slug);
      for (const child of children) {
        ids = ids.concat(await collectChildren(child._id.toString()));
      }
      return ids;
    };

    const allSlugs = [parent.slug, ...(await collectChildren(parent._id.toString()))];

    const [books, total] = await Promise.all([
      this.bookModel.find({ categoryName: { $in: allSlugs } })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      this.bookModel.countDocuments({ categoryName: { $in: allSlugs } }),
    ]);

    let items = await this.attachAuthorName(books);

    return { items, total, page, pages: Math.ceil(total / limit) };
  }

  //reference book
  async getReferenceBooks() {
    // Hai slug cha cần hiển thị
    const parentSlugs = ['sach-tham-khao', 'sach-trong-nuoc'];

    // Lấy category cha
    const categories = await this.categoryModel.find({ slug: { $in: parentSlugs } }).lean();

    // Lấy slug con riêng biệt cho từng category
    const childrenMap: Record<string, string[]> = {};
    for (const cat of categories) {
      const childSlugs = await this.getAllChildrenSlugs(cat._id.toString());
      childrenMap[cat.slug] = [cat.slug, ...childSlugs];
    }

    // ✅ Lấy sách tham khảo
    const sachThamKhao = await this.bookModel.find(
      { categoryName: { $in: childrenMap['sach-tham-khao'] || [] } },
      {
        title: 1,
        author: 1,
        coverImage: 1,
        price: 1,
        flashsale_price: 1,
        discount_percent: 1,
        categoryName: 1,
      }
    ).lean();

    // ✅ Lấy sách trong nước
    const sachTrongNuoc = await this.bookModel.find(
      { categoryName: { $in: childrenMap['sach-trong-nuoc'] || [] } },
      {
        title: 1,
        author: 1,
        coverImage: 1,
        price: 1,
        flashsale_price: 1,
        discount_percent: 1,
        categoryName: 1,
      }
    ).lean();

    // ✅ Map tên tác giả (giống getFeaturedBooks)
    const authors = await this.authorModel.find({}, { name: 1 }).lean();
    const authorMap = new Map(authors.map(a => [a._id.toString(), a.name]));

    const attachAuthorName = (books: any[]) =>
      books.map(b => ({
        ...b,
        authorName:
          typeof b.author === "object" && b.author !== null && "name" in b.author
            ? (b.author as any).name
            : authorMap.get(b.author?.toString?.()) ?? "Không rõ"
      }));

    return {
      sachThamKhao: attachAuthorName(sachThamKhao),
      sachTrongNuoc: attachAuthorName(sachTrongNuoc),
    };
  }

}
