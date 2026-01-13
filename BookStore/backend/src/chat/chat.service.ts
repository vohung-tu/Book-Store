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
    await this.saveMessage(userId, 'user', message);

    // 1️⃣ Nhờ AI detect intent 6 loại hỗ trợ
    const intent = await this.aiService.detectIntent(message);

    switch (intent.intent) {
      case 'get_cheapest_books':
        return this.handleCheapestBooks(userId, message);

      case 'search_books_by_title':
        return this.handleSearchBooksByTitle(userId, message, intent.keywords);

      case 'compare_books':
        return this.handleCompareBooks(userId, message, intent.keywords);

      case 'recommend_books':
        return this.handleRecommendBooks(userId, message);

      case 'order_support':
        return this.handleOrderSupport(userId);

      case 'promotion_info':
        return this.handlePromotionInfo(userId);

      default:
        break;
    }

    // 2️⃣ Báo giá thủ công (fallback)
    const priceIntent = this.detectPriceIntent(message);
    if (priceIntent.isAskPrice) {
      const quotes = await this.findBooks(priceIntent.titles);
      if (!priceIntent.titles.length) {
        return this.replyAndSave(userId, 'Bạn muốn xem giá của cuốn nào ạ?');
      }
      if (!quotes.length) {
        return this.replyAndSave(userId, 'Không tìm thấy sách nào khớp với yêu cầu.');
      }
      const botReply = quotes.map((b) => `• ${b.title}: ${this.formatVND(b.price)}`).join('\n');
      await this.saveMessage(userId, 'bot', botReply);
      return { reply: `Báo giá:\n${botReply}`, quotes };
    }

    // 3️⃣ Fallback AI general
    return this.replyAndSave(
      userId,
      await this.aiService.chatWithAI(
        'Bạn là nhân viên hỗ trợ trực tuyến của cửa hàng sách. Trả lời ngắn gọn, thân thiện, ưu tiên tiếng Việt.',
        message,
      )
    );
  }

  // === Handlers cho các intent ===
  private async handleCheapestBooks(userId: string, message: string) {
    const cheapest = await this.bookModel.find().sort({ price: 1 }).limit(5).lean();
    if (!cheapest.length) return this.replyAndSave(userId, 'Xin lỗi, hiện không có sách nào trong hệ thống.');

    const context = cheapest.map((b, i) => `${i + 1}. ${b.title} - ${this.formatVND(b.price)}`).join('\n');
    const aiReply = await this.aiService.chatWithAI(
      'Bạn là nhân viên hỗ trợ bán sách.',
      `Người dùng hỏi: "${message}". Đây là top 5 sách rẻ nhất:\n${context}\nGiới thiệu top 5 cuốn rẻ nhất.`
    );
    await this.saveMessage(userId, 'bot', aiReply);
    return { reply: aiReply, quotes: cheapest };
  }

  private async handleSearchBooksByTitle(userId: string, message: string, keywords: string[]) {
    if (!keywords?.length) return this.replyAndSave(userId, 'Bạn muốn tìm sách nào? Vui lòng nhập rõ tên sách.');

    const regexes = keywords.map((k) => new RegExp(k, 'i'));
    const books = await this.bookModel.find({ title: { $in: regexes } }).sort({ title: 1 }).lean();

    if (!books.length) return this.replyAndSave(userId, 'Xin lỗi, không tìm thấy sách phù hợp.');

    // ✅ thêm trường link cho mỗi sách
    const quotes = books.map((b) => ({
      _id: b._id,
      title: b.title,
      price: b.price,
      link: `/details/${b._id}`,
      coverImage: b.coverImage,
    }));

    const context = quotes.map((b) => `- ${b.title} (${this.formatVND(b.price)})`).join('\n');
    const aiReply = await this.aiService.chatWithAI(
      'Bạn là nhân viên hỗ trợ bán sách.',
      `Người dùng hỏi: "${message}". Đây là sách tìm được:\n${context}\nHãy trả lời gọn gàng, khuyến khích mua.`
    );

    await this.saveMessage(userId, 'bot', aiReply);
    return { reply: aiReply, quotes };
  }

  private async handleCompareBooks(userId: string, message: string, keywords: string[]) {
    if (keywords.length < 2) {
      return this.replyAndSave(userId, 'Vui lòng nhập ít nhất 2 tên sách để so sánh.');
    }
    const regexes = keywords.map((k) => new RegExp(k, 'i'));
    const books = await this.bookModel.find({ title: { $in: regexes } }).lean();
    if (!books.length) return this.replyAndSave(userId, 'Không tìm thấy sách để so sánh.');

    const context = books.map((b) => `- ${b.title}: ${this.formatVND(b.price)}`).join('\n');
    const aiReply = await this.aiService.chatWithAI(
      'Bạn là chuyên gia so sánh sách.',
      `Người dùng hỏi: "${message}". Thông tin sách tìm được:\n${context}\nSo sánh giá và gợi ý lựa chọn hợp lý.`
    );
    return this.replyAndSave(userId, aiReply, books);
  }

  private async handleRecommendBooks(userId: string, message: string) {
    const topBooks = await this.bookModel.find().sort({ sold: -1 }).limit(5).lean();
    const context = topBooks.map((b) => `- ${b.title} (${this.formatVND(b.price)})`).join('\n');
    const aiReply = await this.aiService.chatWithAI(
      'Bạn là tư vấn viên bán sách cho website.',
      `
    Người dùng yêu cầu tư vấn sách: "${message}"

    DANH SÁCH SÁCH DUY NHẤT ĐƯỢC PHÉP SỬ DỤNG:
    ${context}

    QUY TẮC BẮT BUỘC:
    - CHỈ được gợi ý sách có trong danh sách trên
    - TUYỆT ĐỐI KHÔNG bịa thêm sách ngoài danh sách
    - Nếu không có sách phù hợp, hãy nói rõ "Hiện chưa có sách phù hợp"
    - Trả lời tự nhiên, thân thiện
    `
    );
    return this.replyAndSave(userId, aiReply, topBooks);
  }

  private async handleOrderSupport(userId: string) {
    const reply = `Bạn có thể đặt hàng trực tiếp qua giỏ hàng trên website. 
1. Chọn sách muốn mua, nhấn "Thêm vào giỏ". 
2. Vào giỏ hàng, nhấn "Thanh toán". 
3. Điền thông tin nhận hàng và xác nhận.`;
    return this.replyAndSave(userId, reply);
  }

  private async handlePromotionInfo(userId: string) {
    const reply = `Hiện đang có các khuyến mãi hấp dẫn: 
- Giảm 10% cho đơn từ 200k. 
- Freeship cho đơn từ 300k. 
Bạn có muốn xem danh sách coupon đang hoạt động không?`;
    return this.replyAndSave(userId, reply);
  }

  // === Helpers ===
  private async replyAndSave(userId: string, content: string, quotes: any[] = []) {
    await this.saveMessage(userId, 'bot', content);
    return { reply: content, quotes };
  }

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

  async getWelcomeMessage(userId: string) {
    const topBooks = await this.bookModel.find().sort({ createdAt: -1 }).limit(5).lean();
    const bookList = topBooks.map((b) => `- ${b.title} (${this.formatVND(b.price)})`).join('\n');

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
