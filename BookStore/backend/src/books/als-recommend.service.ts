import { Injectable, Logger } from '@nestjs/common';
import * as fs from 'fs';
import * as path from 'path';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Book, BookDocument } from './book.schema';

interface AlsModelFile {
  embedding_dim: number;
  users: string[];
  books: string[];
  user_factors: number[][];
  item_factors: number[][];
}

@Injectable()
export class AlsRecommendService {
  private readonly logger = new Logger(AlsRecommendService.name);

  private users: string[] = [];
  private books: string[] = [];

  private userIndex = new Map<string, number>();
  private bookIndex = new Map<string, number>();

  private userFactors: number[][] = [];
  private itemFactors: number[][] = [];

  private embeddingDim = 0;

  constructor(
    @InjectModel(Book.name) private bookModel: Model<BookDocument>,
  ) {
    this.loadALSModel();
  }

  /** ============================================
   *  Load mô hình từ file JSON
   * ============================================ */
  private loadALSModel() {
    try {
      const distPath = path.join(process.cwd(), 'dist', 'data', 'als_user_item_model.json');
      const devPath = path.join(process.cwd(), 'src', 'data', 'als_user_item_model.json');
      const finalPath = fs.existsSync(distPath) ? distPath : devPath;

      this.logger.log(`📁 Loading ALS Model from: ${finalPath}`);

      const raw = fs.readFileSync(finalPath, 'utf8');
      const model: AlsModelFile = JSON.parse(raw);

      this.embeddingDim = model.embedding_dim;
      this.users = model.users;
      this.books = model.books;
      this.userFactors = model.user_factors;
      this.itemFactors = model.item_factors;

      // Map userId → index
      this.userIndex = new Map(model.users.map((u, i) => [u, i]));

      // Map bookId → index
      this.bookIndex = new Map(model.books.map((b, i) => [b, i]));

      this.logger.log(
        `✅ ALS model loaded: ${this.users.length} users, ${this.books.length} books`
      );

    } catch (err) {
      this.logger.error('❌ Failed to load ALS Model', err);
    }
  }

  /** ============================================
   *  Cosine Similarity
   * ============================================ */
  private cosine(a: number[], b: number[]): number {
    let dot = 0, ma = 0, mb = 0;

    for (let i = 0; i < a.length; i++) {
      dot += a[i] * b[i];
      ma += a[i] * a[i];
      mb += b[i] * b[i];
    }
    if (ma === 0 || mb === 0) return 0;

    return dot / Math.sqrt(ma * mb);
  }

  /** ============================================
   *  Gợi ý theo userId → Sách
   * ============================================ */
  async recommendForUser(userId: string, topN = 6) {
    const uidx = this.userIndex.get(userId);

    if (uidx === undefined) {
      this.logger.warn(`❗ User không có trong mô hình ALS: ${userId}`);
      return [];
    }

    const userVec = this.userFactors[uidx];

    const scores: { id: string; score: number }[] = [];

    for (let i = 0; i < this.books.length; i++) {
      const vec = this.itemFactors[i];
      const score = this.cosine(userVec, vec);
      scores.push({ id: this.books[i], score });
    }

    scores.sort((a, b) => b.score - a.score);

    const ids = scores.slice(0, topN).map(s => s.id);

    const books = await this.bookModel.find({ _id: { $in: ids } }).lean();
    const map = new Map(books.map(b => [String(b._id), b]));

    return ids.map(id => map.get(id)).filter(Boolean);
  }

  /** ============================================
   *  Gợi ý item → item (Sản phẩm tương tự)
   * ============================================ */
  async relatedBooks(bookId: string, topN = 6) {
    const bidx = this.bookIndex.get(bookId);

    if (bidx === undefined) {
      this.logger.warn(`❗ Book không có trong ALS: ${bookId}`);
      return [];
    }

    const targetVec = this.itemFactors[bidx];

    const scores: { id: string; score: number }[] = [];

    for (let i = 0; i < this.books.length; i++) {
      if (i === bidx) continue;

      const score = this.cosine(targetVec, this.itemFactors[i]);
      scores.push({ id: this.books[i], score });
    }

    scores.sort((a, b) => b.score - a.score);

    const ids = scores.slice(0, topN).map((s) => s.id);

    const books = await this.bookModel.find({ _id: { $in: ids } }).lean();
    const map = new Map(books.map(b => [String(b._id), b]));

    return ids.map(id => map.get(id)).filter(Boolean);
  }
}
