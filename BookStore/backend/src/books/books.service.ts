import { BadRequestException, Injectable, InternalServerErrorException, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Book, BookDocument } from './book.schema';
import { ClientSession, Model, Types } from 'mongoose';
import { Order } from 'src/order/order/order.schema';
import { Author } from 'src/authors/authors.schema';
import { Category, CategoryDocument } from 'src/categories/categories.schema';
import { PipelineStage } from 'mongoose';
import { AiService } from 'src/ai-helpers/ai.service';
import { StoreBranchInventory } from 'src/store-branch/schemas/store-branch-inventory.schema';
import { Inventory } from 'src/inventory/schemas/inventory-branch.schema';

@Injectable()
export class BooksService {
  constructor(
    @InjectModel(Book.name) private bookModel: Model<BookDocument>,
    @InjectModel(Author.name) private authorModel: Model<Author>,
    @InjectModel(Order.name) private orderModel: Model<Order>,
    @InjectModel(Category.name) private categoryModel: Model<CategoryDocument>,
    @InjectModel(StoreBranchInventory.name) private storeBranchInventoryModel: Model<StoreBranchInventory>,
    @InjectModel(Inventory.name) private readonly warehouseInventoryModel: Model<Inventory>,
    private aiService: AiService
    ) {}

  async create(book: Book): Promise<Book> {
    console.log('CREATE BOOK PAYLOAD:', book);
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
    const authorMap = new Map(
      authors.map(a => [a._id.toString(), a.name])
    );

    return books.map(book => {
      let authorName: string | null = null;

      // Trường hợp đã populate author
      if (
        typeof book.author === 'object' &&
        book.author !== null &&
        'name' in book.author
      ) {
        authorName = (book.author as any).name ?? null;
      }
      // Trường hợp author là ObjectId
      else if (book.author) {
        authorName = authorMap.get(book.author.toString()) ?? null;
      }

      return {
        ...book,
        authorName
      };
    });
  }

  async findAllBooks(page = 1, limit = 20) {
    page = Math.max(1, Number(page) || 1);
    limit = Math.max(1, Number(limit) || 20);
    const skip = (page - 1) * limit;

    const projection = {
      _id: 1,
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
      createdAt: 1,
      supplierId: 1,
    } as const;

    const soldStatsPipeline: PipelineStage[] = [
      { $unwind: '$products' },
      {
        $addFields: {
          bookRef: {
            $ifNull: [
              '$products.book',
              { $ifNull: ['$products.bookId', '$products._id'] },
            ],
          },
        },
      },
      { $match: { bookRef: { $ne: null } } },
      {
        $group: {
          _id: '$bookRef',
          totalSold: { $sum: { $ifNull: ['$products.quantity', 0] } },
        },
      },
    ];

    const [books, total, soldStats] = await Promise.all([
      this.bookModel
        .find({}, projection)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate('supplierId', 'name code email phone address')
        .lean(),
      this.bookModel.countDocuments(),
      this.orderModel.aggregate<{ _id: Types.ObjectId | string; totalSold: number }>(soldStatsPipeline),
    ]);

    const soldMap = new Map<string, number>();
    for (const s of soldStats ?? []) {
      if (s?._id != null) soldMap.set(String(s._id), Number(s.totalSold) || 0);
    }

    let items = (books ?? []).map((b) => {
      const key = b?._id ? String(b._id) : undefined;
      const computedSold = key ? soldMap.get(key) ?? 0 : 0;
      return {
        ...b,
        sold: (b as any)?.sold != null ? Number((b as any).sold) : computedSold,
      };
    });

    try {
      items = await this.attachAuthorName(items);
    } catch {}

    return { items, total, page, pages: Math.ceil(total / limit) };
  }

  async getRecommendedBooks() {
    // Lấy danh sách tiêu đề sách thật trong DB
    const allBooks = await this.bookModel.find({}, { title: 1 }).limit(50).lean();
    const bookTitles = allBooks.map(b => b.title).join(', ');

    // Gửi prompt cho AI
    const prompt = `
    Dưới đây là danh sách 50 cuốn sách hiện có trong cửa hàng:
    ${bookTitles}

    Hãy chọn 5 cuốn sách phù hợp để gợi ý cho người đọc Việt Nam.
    Trả về JSON hợp lệ dạng:
    [{"title":"Tên sách","author":"Tên tác giả"}]
    Chỉ trả JSON, không mô tả gì thêm.
    `;

    const aiRecommendations = await this.aiService.getJsonResponse(prompt);

    // Đối chiếu lại với DB để chỉ lấy sách có thật
    const titles = aiRecommendations.map(r => new RegExp(r.title, 'i'));
    const matchedBooks = await this.bookModel.find({ title: { $in: titles } }).limit(5).lean();

    return matchedBooks.length ? matchedBooks : await this.bookModel.aggregate([{ $sample: { size: 5 } }]);
  }

  async getHalloweenBooks(): Promise<Book[]> {
    const regex = /halloween/i;

    return this.bookModel
      .find({
        $or: [
          { title: { $regex: regex } },
          { description: { $regex: regex } },
        ],
      })
      .sort({ createdAt: -1 })
      .limit(10)
      .lean();
  }

  async getFeaturedBooks(limit = 10) {
    const projection = {
      _id: 1,
      title: 1,
      author: 1,
      price: 1,
      flashsale_price: 1,
      discount_percent: 1,
      coverImage: 1,
      publishedDate: 1,
      categoryName: 1,
      createdAt: 1,
    } as const;

    const books = await this.bookModel
      .find({}, projection)
      .sort({ createdAt: -1 })
      .limit(limit * 2)
      .lean();

    // soldStats giống cách trên, lọc null trước khi group
    const soldPipe: PipelineStage[] = [
      { $unwind: '$products' },
      { $match: { 'products._id': { $ne: null } } },
      {
        $group: {
          _id: '$products._id',
          totalSold: { $sum: { $ifNull: ['$products.quantity', 0] } },
        },
      },
    ];
    const soldStats = await this.orderModel.aggregate<{ _id: any; totalSold: number }>(soldPipe);

    const soldMap = new Map<string, number>();
    for (const r of soldStats ?? []) {
      const key = idStr(r?._id);
      if (key) soldMap.set(key, Number(r.totalSold) || 0);
    }

    let booksWithSold = (books ?? []).map((b: any) => {
      const key = idStr(b?._id);
      return { ...b, sold: key ? soldMap.get(key) ?? 0 : 0 };
    });

    try { booksWithSold = await this.attachAuthorName(booksWithSold); } catch {}

    return booksWithSold
      .sort((a: any, b: any) => (b.sold ?? 0) - (a.sold ?? 0))
      .slice(0, limit);
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
  async deleteMany(ids: string[]) {
    return this.bookModel.deleteMany({
      _id: { $in: ids }
    });
  }

  async findOne(id: string): Promise<Book | null> {
    const book = await this.bookModel
      .findById(id)
      .populate('category')
      .populate('supplierId', 'name code email phone address')
      .exec();

    if (!book) return null;

    if (book.author instanceof Types.ObjectId) {
      await book.populate('author');
    }

    return book;
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
  
  async findAllDetailed() {
    const books = await this.bookModel.find().lean();

    return Promise.all(
      books.map(async (book) => {
        // ✅ Ép kiểu _id an toàn
        const rawId: any = book._id;
        const bookId = Types.ObjectId.isValid(rawId)
          ? new Types.ObjectId(String(rawId))
          : null;

        if (!bookId) {
          console.warn('⚠️ Bỏ qua sách có ID không hợp lệ:', rawId);
          return null;
        }

        // ✅ Lấy tồn kho kho trung tâm
        const warehouseStocks = await this.warehouseInventoryModel
          .find({ bookId })
          .populate('branchId', 'name region')
          .lean();

        // ✅ Lấy tồn kho cửa hàng
        const storeStocks = await this.storeBranchInventoryModel
          .find({ book: bookId })
          .populate('storeBranch', 'name city region')
          .lean();

        // ✅ Tính tổng
        const totalQty =
          warehouseStocks.reduce((sum, w) => sum + (w.quantity || 0), 0) +
          storeStocks.reduce((sum, s) => sum + (s.quantity || 0), 0);

        return {
          ...book,
          quantity: totalQty,
          warehouseStocks: warehouseStocks.map((w: any) => ({
            name: (w.branchId as any)?.name || 'Không rõ',
            region: (w.branchId as any)?.region || '',
            quantity: w.quantity || 0,
          })),
          storeStocks: storeStocks.map((s: any) => ({
            name: (s.storeBranch as any)?.name || 'Không rõ',
            city: (s.storeBranch as any)?.city || '',
            region: (s.storeBranch as any)?.region || '',
            quantity: s.quantity || 0,
          })),
        };
      }),
    ).then((result) => result.filter(Boolean)); // bỏ null
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
    const soldPipe: PipelineStage[] = [
      { $unwind: '$products' },
      // lọc record không có products._id (tránh null ngay từ đầu)
      { $match: { 'products._id': { $ne: null } } },
      {
        $group: {
          _id: '$products._id',
          totalSold: { $sum: { $ifNull: ['$products.quantity', 0] } },
        },
      },
      { $sort: { totalSold: -1 } },
      { $limit: limit },
    ];

    const bestSellers = await this.orderModel.aggregate<{ _id: any; totalSold: number }>(soldPipe);

    // Map an toàn (chỉ set khi có _id)
    const soldMap = new Map<string, number>();
    for (const r of bestSellers ?? []) {
      const key = idStr(r?._id);
      if (key) soldMap.set(key, Number(r.totalSold) || 0);
    }

    // Chuẩn bị danh sách id để find
    const idKeys = Array.from(soldMap.keys());
    const inIds = toObjectIds(idKeys).length ? toObjectIds(idKeys) : idKeys;

    let books = await this.bookModel.find(
      { _id: { $in: inIds } },
      { title: 1, author: 1, coverImage: 1, price: 1, flashsale_price: 1, discount_percent: 1, sold: 1 }
    ).lean();

    // gắn sold (không .toString() trực tiếp)
    let items = (books ?? []).map((b: any) => {
      const key = idStr(b?._id);
      const computedSold = key ? soldMap.get(key) ?? 0 : 0;
      return { ...b, sold: b?.sold != null ? Number(b.sold) : computedSold };
    });

    try { items = await this.attachAuthorName(items); } catch {}

    return items;
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

    async getRelatedBooks(bookId: string) {
      const currentBook = await this.bookModel.findById(bookId).lean();
      if (!currentBook) {
        throw new NotFoundException('Book not found');
      }

      // Lấy tất cả sách khác (không bao gồm sách hiện tại)
      const allBooks = await this.bookModel.find(
        { _id: { $ne: currentBook._id } },
        { title: 1, description: 1, coverImage: 1, price: 1, flashsale_price: 1, discount_percent: 1, categoryName: 1, embedding: 1, author: 1 }
      ).lean();

      // Đảm bảo sách hiện tại có embedding
      if (!Array.isArray(currentBook.embedding) || !currentBook.embedding.length) {
        try {
          const embed = await this.aiService.createEmbedding(
            `${currentBook.title} ${currentBook.description || ''}`
          );

          await this.bookModel.updateOne(
            { _id: currentBook._id },
            { $set: { embedding: embed } }
          );

          (currentBook as any).embedding = embed;
        } catch (e) {
          console.error('❌ Cannot create embedding for current book:', currentBook._id, e);
        }
      }

      // Lọc những sách có embedding để dùng cosine
      const booksWithEmbedding = allBooks.filter(
        b => Array.isArray(b.embedding) && b.embedding.length
      );

      // 🔹 1. Ưu tiên: Recommend bằng embedding nếu đủ dữ liệu
      if (currentBook.embedding?.length && booksWithEmbedding.length >= 3) {
        const byEmbedding = await this.aiService.recommendRelatedBooks(currentBook, booksWithEmbedding);

        if (byEmbedding && byEmbedding.length) {
          return byEmbedding.map(({ score, ...rest }) => rest); // bỏ field score
        }
      }

      // 🔹 2. Fallback: dùng AI text để recommend
      try {
        const aiResult = await this.aiService.recommendByAI(
          currentBook.title,
          currentBook.description || '',
          allBooks
        );

        if (aiResult && aiResult.length) {
          // Nếu AI trả về _id → dùng trực tiếp
          const idsFromAI = aiResult
            .map((r: any) => r._id)
            .filter((id: any) => !!id);

          if (idsFromAI.length) {
            const matched = await this.bookModel.find(
              { _id: { $in: idsFromAI } },
              { title: 1, author: 1, coverImage: 1, price: 1, flashsale_price: 1, discount_percent: 1, categoryName: 1 }
            ).lean();

            if (matched.length) return matched;
          }

          // Nếu AI chỉ trả title: match theo tiêu đề
          const titles = aiResult
            .map((r: any) => r.title)
            .filter((t: any) => !!t)
            .map((t: string) => new RegExp(t, 'i'));

          if (titles.length) {
            const matchedByTitle = await this.bookModel.find(
              { title: { $in: titles }, _id: { $ne: currentBook._id } },
              { title: 1, author: 1, coverImage: 1, price: 1, flashsale_price: 1, discount_percent: 1, categoryName: 1 }
            )
            .limit(5)
            .lean();

            if (matchedByTitle.length) return matchedByTitle;
          }
        }
      } catch (e) {
        console.error('❌ AI fallback recommend error:', e);
      }

      // 🔹 3. Fallback cuối: lấy random cùng category (phòng trường hợp AI hỏng)
      const sameCategory = await this.bookModel.find(
        {
          _id: { $ne: currentBook._id },
          categoryName: currentBook.categoryName
        },
        { title: 1, author: 1, coverImage: 1, price: 1, flashsale_price: 1, discount_percent: 1, categoryName: 1 }
      )
        .limit(5)
        .lean();

      return sameCategory;
    }

    async findById(id: string) {
      if (!Types.ObjectId.isValid(id)) {
        throw new BadRequestException('Book ID không hợp lệ');
      }

      return this.bookModel
        .findById(id)
        .populate('category', 'name slug parentId')
        .lean();
    }

  async generateEmbeddingsForAll() {
    const books = await this.bookModel.find({}, { title: 1, description: 1, embedding: 1 }).lean();

    let updated = 0;

    for (const book of books) {
      // Nếu đã có embedding thì bỏ qua
      if (Array.isArray(book.embedding) && book.embedding.length) continue;

      try {
        const embed = await this.aiService.createEmbedding(
          `${book.title} ${book.description || ''}`
        );

        await this.bookModel.updateOne(
          { _id: book._id },
          { $set: { embedding: embed } }
        );

        updated++;
      } catch (e) {
        console.error('❌ Generate embedding failed for book:', book._id, e);
      }
    }

    return { message: 'Embeddings generated successfully', updated };
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
    const parentSlugs = ['sach-tham-khao', 'sach-trong-nuoc'];

    const categories = await this.categoryModel
      .find({ slug: { $in: parentSlugs } })
      .lean();

    const childrenMap: Record<string, string[]> = {};
    for (const cat of categories) {
      const childSlugs = await this.getAllChildrenSlugs(cat._id.toString());
      childrenMap[cat.slug] = [cat.slug, ...childSlugs];
    }

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

    const authors = await this.authorModel.find({}, { name: 1 }).lean();
    const authorMap = new Map(authors.map(a => [a._id.toString(), a.name]));

    const attachAuthorName = (books: any[]) =>
      books.map(b => {
        let authorName: string | null = null;

        if (typeof b.author === 'object' && b.author !== null && 'name' in b.author) {
          authorName = (b.author as any).name;
        } else if (b.author) {
          authorName = authorMap.get(b.author.toString()) ?? null;
        }

        return {
          ...b,
          authorName,
        };
      });

    return {
      sachThamKhao: attachAuthorName(sachThamKhao),
      sachTrongNuoc: attachAuthorName(sachTrongNuoc),
    };
  }


}

const idStr = (v: any) => (v == null ? undefined : String(v));
const toObjectIds = (ids: (string | undefined)[]) =>
  ids.filter(Boolean)
     .map(s => Types.ObjectId.isValid(s!) ? new Types.ObjectId(s!) : null)
     .filter((x): x is Types.ObjectId => !!x);

