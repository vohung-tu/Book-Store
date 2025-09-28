import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Book, BookDocument } from '../books/book.schema';
import { AiService } from '../ai-helpers/ai.service';

@Injectable()
export class ChatService {
  constructor(
    @InjectModel(Book.name) private readonly bookModel: Model<BookDocument>,
    private readonly aiService: AiService,
  ) {}

  async handleMessage(message: string) {
    // Kiểm tra intent hỏi giá
    const intent = this.detectPriceIntent(message);
    if (intent.isAskPrice) {
      if (!intent.titles.length) {
        return { reply: 'Bạn muốn xem giá của cuốn nào ạ?', quotes: [] };
      }
      const quotes = await this.findBooks(intent.titles);
      if (!quotes.length) {
        return { reply: 'Không tìm thấy sách nào khớp với yêu cầu.', quotes: [] };
      }
      const reply = quotes
        .map((b) => `• ${b.title}: ${this.formatVND(b.price)}`)
        .join('\n');
      return { reply: `Báo giá:\n${reply}`, quotes };
    }

    // Không phải hỏi giá -> gọi AI
    const completion = await this.aiService.chatWithAI(
      'Bạn là nhân viên hỗ trợ trực tuyến của cửa hàng sách. Trả lời ngắn gọn, thân thiện, ưu tiên tiếng Việt.',
      message,
    );
    return { reply: completion, quotes: [] };
  }

  private detectPriceIntent(message: string) {
    const regex = /(giá|báo giá)\s+(?:sách\s+)?(.+)/i;
    const m = message.match(regex);
    const titles = m?.[2]
      ? m[2].split(/,| và |\/|\|/i).map((t) => t.trim()).filter(Boolean)
      : [];
    return { isAskPrice: !!m, titles };
  }

  private async findBooks(titles: string[]) {
    const regexes = titles.map((t) => new RegExp(t, 'i'));
    return this.bookModel.find({ title: { $in: regexes } }).limit(10).lean();
  }

  private formatVND(n: number) {
    return n.toLocaleString('vi-VN', { style: 'currency', currency: 'VND' });
  }
}
