import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { ViewHistory, ViewHistoryDocument } from './view-history.schema';
import { Book, BookDocument } from 'src/books/book.schema';

@Injectable()
export class ViewHistoryService {
  constructor(
    @InjectModel(ViewHistory.name)
    private viewHistoryModel: Model<ViewHistoryDocument>,
    @InjectModel(Book.name) 
    private bookModel: Model<BookDocument>,
  ) {}

  // Ghi lại lịch sử xem
  async recordView(userId: string, bookId: string) {
    await this.viewHistoryModel.create({ userId, bookId });
  }

  // Lấy 5 sách xem gần nhất
  async getRecentViews(userId: string) {
    const views = await this.viewHistoryModel
      .find({ userId })
      .sort({ viewedAt: -1 })
      .limit(20)
      .lean();

    const uniqueBookIds: string[] = [];
    const seen = new Set();

    for (const v of views) {
      if (!seen.has(v.bookId)) {
        seen.add(v.bookId);
        uniqueBookIds.push(v.bookId);
      }
      if (uniqueBookIds.length >= 5) break;
    }

    // Lấy thông tin sách theo list ID
    const books = await this.bookModel
      .find({ _id: { $in: uniqueBookIds } })
      .lean();

    // Sắp xếp đúng order người xem (vì $in không giữ thứ tự)
    const idToBook = new Map(books.map(b => [String(b._id), b]));

    return uniqueBookIds.map(id => idToBook.get(id)).filter(Boolean);
  }

}
