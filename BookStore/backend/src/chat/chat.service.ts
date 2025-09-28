import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Book, BookDocument } from '../books/book.schema';
import { AiService } from '../ai-helpers/ai.service';
import { ChatHistory, ChatHistoryDocument } from './chat-history.schema';

@Injectable()
export class ChatService {
  constructor(
    @InjectModel(Book.name) private readonly bookModel: Model<BookDocument>,
    @InjectModel(ChatHistory.name) private readonly historyModel: Model<ChatHistoryDocument>,
    private readonly aiService: AiService,
  ) {}

  async handleMessage(message: string, userId: string) {
    // Lưu tin nhắn user trước
    await this.saveMessage(userId, 'user', message);

    // 1️⃣ Detect intent bằng AI
    const intent = await this.aiService.detectIntent(message);

    if (intent.intent === 'get_cheapest_books') {
      return this.handleCheapestBooks(userId, message);
    }

    if (intent.intent === 'search_books_by_title') {
      return this.handleSearchBooksByTitle(userId, message, intent.keywords);
    }

    // 2️⃣ Báo giá thủ công nếu detect bằng regex
    const priceIntent = this.detectPriceIntent(message);
    if (priceIntent.isAskPrice) {
      if (!priceIntent.titles.length) {
        const botReply = 'Bạn muốn xem giá của cuốn nào ạ?';
        await this.saveMessage(userId, 'bot', botReply);
        return { reply: botReply, quotes: [] };
      }
      const quotes = await this.findBooks(priceIntent.titles);
      if (!quotes.length) {
        const botReply = 'Không tìm thấy sách nào khớp với yêu cầu.';
        await this.saveMessage(userId, 'bot', botReply);
        return { reply: botReply, quotes: [] };
      }
      const botReply = quotes.map((b) => `• ${b.title}: ${this.formatVND(b.price)}`).join('\n');
      await this.saveMessage(userId, 'bot', botReply);
      return { reply: `Báo giá:\n${botReply}`, quotes };
    }

    // 3️⃣ Nếu không có intent đặc biệt → gọi AI trả lời tự do
    const aiReply = await this.aiService.chatWithAI(
      'Bạn là nhân viên hỗ trợ trực tuyến của cửa hàng sách. Trả lời ngắn gọn, thân thiện, ưu tiên tiếng Việt.',
      message,
    );
    await this.saveMessage(userId, 'bot', aiReply);
    return { reply: aiReply, quotes: [] };
  }

  // === Intent handlers ===
  private async handleCheapestBooks(userId: string, message: string) {
    const cheapest = await this.bookModel.find().sort({ price: 1 }).limit(5).lean();

    if (!cheapest.length) {
      return { reply: 'Xin lỗi, hiện không có sách nào trong hệ thống.', quotes: [] };
    }

    const context = cheapest.map((b, i) => `${i + 1}. ${b.title} - ${this.formatVND(b.price)}`).join('\n');
    const prompt = `Người dùng hỏi: "${message}".
Dưới đây là danh sách 5 sách rẻ nhất:
${context}

Hãy giới thiệu top 3 cuốn rẻ nhất kèm giá một cách thân thiện.`;

    const aiReply = await this.aiService.chatWithAI(
      'Bạn là nhân viên hỗ trợ bán sách.',
      prompt,
    );

    await this.saveMessage(userId, 'bot', aiReply);
    return { reply: aiReply, quotes: cheapest };
  }

  private async handleSearchBooksByTitle(userId: string, message: string, keywords: string[]) {
    if (!keywords?.length) {
      return { reply: 'Bạn muốn tìm sách nào? Vui lòng nhập rõ tên sách.', quotes: [] };
    }

    const regexes = keywords.map((k) => new RegExp(k, 'i'));
    const books = await this.bookModel.find({ title: { $in: regexes } }).sort({ title: 1 }).lean();

    if (!books.length) {
      return { reply: 'Xin lỗi, không tìm thấy sách phù hợp.', quotes: [] };
    }

    const context = books.map((b) => `- ${b.title} (${this.formatVND(b.price)})`).join('\n');
    const prompt = `Người dùng hỏi: "${message}".
Danh sách sách phù hợp tìm được:
${context}

Hãy liệt kê các tựa sách kèm giá, khuyến khích người dùng mua.`;

    const aiReply = await this.aiService.chatWithAI(
      'Bạn là nhân viên hỗ trợ bán sách.',
      prompt,
    );

    await this.saveMessage(userId, 'bot', aiReply);
    return { reply: aiReply, quotes: books };
  }

  // === DB Helpers ===
  async getHistory(userId: string) {
    const history = await this.historyModel.findOne({ userId }).lean();
    return history?.messages ?? [];
  }

  async saveMessage(userId: string, role: 'user' | 'bot', content: string) {
    const id = new Types.ObjectId(userId);
    await this.historyModel.findOneAndUpdate(
      { userId: id },
      { $push: { messages: { role, content } } },
      { upsert: true, new: true }
    );
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

  // === Welcome Message ===
  async getWelcomeMessage(userId: string) {
    const topBooks = await this.bookModel.find().sort({ createdAt: -1 }).limit(5).lean();

    const bookList = topBooks
      .map((b) => `- ${b.title} (${this.formatVND(b.price)})`)
      .join('\n');

    const systemPrompt = `Bạn là nhân viên hỗ trợ bán sách.
Ngữ cảnh:
Chúng tôi hiện đang có các sách nổi bật:
${bookList}

Nhiệm vụ:
Hãy giới thiệu ngắn gọn những việc bạn có thể làm cho khách hàng:
1. Tìm kiếm thông tin sách
2. So sánh giá
3. Tư vấn chọn sách
4. Hỗ trợ đặt hàng
5. Gợi ý khuyến mãi
6. Trả lời câu hỏi về sách, đơn hàng.

Viết lời chào thân thiện, tự nhiên (giống như Tiki), và liệt kê gọn gàng dưới dạng số thứ tự.`;

    const aiReply = await this.aiService.chatWithAI(systemPrompt, 'Hãy gợi ý các chức năng bạn có thể giúp.');

    await this.saveMessage(userId, 'bot', aiReply);

    return { reply: aiReply };
  }
}
