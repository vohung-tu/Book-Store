import { Injectable, Logger } from '@nestjs/common';
import * as fs from 'fs';
import * as path from 'path';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Book, BookDocument } from './book.schema';

interface EmbeddingFile {
  embedding_dim: number;
  embeddings: Record<string, number[]>;
}

@Injectable()
export class AlsRecommendService {
  private readonly logger = new Logger(AlsRecommendService.name);
  private embeddings = new Map<string, number[]>();
  private dim = 0;

  constructor(
    @InjectModel(Book.name) private bookModel: Model<BookDocument>,
  ) {
    this.loadEmbeddings();
  }

  private loadEmbeddings() {
    try {
      // 🔥 Tạo path an toàn tuyệt đối
      const filePath = path.join(process.cwd(), 'dist', 'data', 'als_item_embeddings.json');

      // Nếu chạy dev (chưa build), dùng file từ src
      const devPath = path.join(process.cwd(), 'src', 'data', 'als_item_embeddings.json');

      const finalPath = fs.existsSync(filePath) ? filePath : devPath;

      this.logger.log(`📁 ALS Path đang dùng: ${finalPath}`);

      const raw = fs.readFileSync(finalPath, 'utf8');
      const parsed: EmbeddingFile = JSON.parse(raw);

      this.dim = parsed.embedding_dim;
      this.embeddings = new Map(Object.entries(parsed.embeddings));

      this.logger.log(`✅ ALS loaded: ${this.embeddings.size} items`);
    } catch (err) {
      this.logger.error('❌ Không thể load ALS embeddings', err);
    }
  }


  private cosineSimilarity(a: number[], b: number[]) {
    let dot = 0,
      magA = 0,
      magB = 0;

    for (let i = 0; i < a.length; i++) {
      dot += a[i] * b[i];
      magA += a[i] * a[i];
      magB += b[i] * b[i];
    }

    if (magA === 0 || magB === 0) return 0;

    return dot / Math.sqrt(magA * magB);
  }

  async getRelatedBooks(bookId: string, topN = 6) {
    const target = this.embeddings.get(bookId);

    if (!target) {
      this.logger.warn(`❗ Không có embedding cho sách ${bookId}`);
      return [];
    }

    const scores: { id: string; score: number }[] = [];

    for (const [id, emb] of this.embeddings.entries()) {
      if (id === bookId) continue;

      const score = this.cosineSimilarity(target, emb);
      scores.push({ id, score });
    }

    scores.sort((a, b) => b.score - a.score);

    const topIds = scores.slice(0, topN).map((s) => s.id);

    const books = await this.bookModel.find({ _id: { $in: topIds } }).lean();

    const mapBooks = new Map(books.map((b) => [String(b._id), b]));

    return topIds.map((id) => mapBooks.get(id)).filter(Boolean);
  }
}
