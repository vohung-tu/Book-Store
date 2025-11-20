import { Injectable, InternalServerErrorException } from '@nestjs/common';
import OpenAI from 'openai';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class AiService {
  private client: OpenAI;

  constructor(private configService: ConfigService) {
    const apiKey = this.configService.get<string>('OPENAI_API_KEY');
    console.log('API Key loaded?', apiKey ? '✅ Có key' : '❌ Không có key');

    this.client = new OpenAI({
      baseURL: 'https://openrouter.ai/api/v1',
      apiKey,
      // Optionally reflect your app appearance
      defaultHeaders: {
        'HTTP-Referer': 'https://book-store-v302.onrender.com/',
        'X-Title': 'PamTech',
      },
    });
  }

  async generateSummary(title: string, description = ''): Promise<string> {
    const prompt = `Bạn là một trợ lý nội dung sách chuyên nghiệp. 
    Hãy viết phần tóm tắt giới thiệu cho cuốn sách "${title}". 
    Trình bày theo phong cách bìa sau sách, bao gồm:

    - Một đoạn mở đầu hấp dẫn, gợi ý lý do nên đọc.
    - Mục "Nội dung": mô tả ngắn gọn chủ đề và hành trình chính của cuốn sách.
    - Các ý quan trọng được liệt kê rõ ràng dưới dạng bullet point.
    - Mục "Điểm nổi bật" hoặc "Vì sao nên đọc": nêu giá trị, lợi ích, điều độc giả nhận được.
    - Mục "Đối tượng độc giả" hoặc "Tác giả" (nếu cần), để người đọc biết sách phù hợp với ai và do ai viết.

    Ngôn ngữ súc tích, dễ hiểu, lôi cuốn.
    ${description ? `\nMô tả thêm: ${description}` : ''}`;

    try {
      const res = await this.client.chat.completions.create({
        model: 'openai/gpt-4o-mini',   // ✅ dùng model chuẩn
        messages: [{ role: 'user', content: prompt }],
      });

      if (!res.choices || !res.choices[0]?.message?.content) {
        throw new Error('AI không trả về nội dung');
      }

      return res.choices[0].message.content.trim();
    } catch (err: any) {
      if (err.response) {
        console.error('❌ AI summary error response:', err.response.status, err.response.data);
      } else {
        console.error('❌ AI summary error:', err.message || err);
      }
      throw new Error('AI summary generation failed');
    }
  }

  async chatWithAI(systemPrompt: string, userMessage: string): Promise<string> {
    try {
      const res = await this.client.chat.completions.create({
        model: 'openai/gpt-4o-mini',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userMessage },
        ],
      });

      return res.choices[0]?.message?.content?.trim() ?? '';
    } catch (err: any) {
      console.error('AI chat error:', err.message || err);
      return 'Xin lỗi, tôi đang gặp sự cố khi trả lời.';
    }
  }

   async detectIntent(message: string): Promise<{ intent: string; keywords: string[] }> {
    const systemPrompt = `Bạn là bộ phân loại intent cho chatbot bán sách.
Trả về JSON theo định dạng:
{"intent": "get_cheapest_books|search_books_by_title|other", "keywords": ["..."]}

- Nếu người dùng hỏi sách rẻ nhất, intent = "get_cheapest_books".
- Nếu hỏi về sách theo tên (vd: "One Piece tập nào", "có sách Clean Code không"), intent = "search_books_by_title" và keywords là các tên sách tìm được.
- Nếu không rõ, intent = "other".`;

    try {
      const res = await this.client.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: message },
        ],
        response_format: { type: 'json_object' },
        temperature: 0,
      });

      return JSON.parse(res.choices[0].message?.content || '{}');
    } catch (e) {
      console.error('❌ Detect intent error:', e);
      return { intent: 'other', keywords: [] };
    }
  }

  async recommendBooks() {
    const prompt = `
    Bạn là hệ thống gợi ý sách cho website bán sách online.

    ⚠️ Hãy chỉ trả về JSON hợp lệ, KHÔNG viết thêm văn bản mô tả.
    Hãy gợi ý 5 cuốn sách nổi tiếng mà người dùng Việt Nam có thể quan tâm.
    Mỗi phần tử là 1 object có dạng:
    [
      { "title": "Tên sách", "author": "Tên tác giả" },
      ...
    ]
    Trả về CHỈ JSON, KHÔNG viết chú thích, không giải thích.
    `;

    const res = await this.client.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [{ role: 'user', content: prompt }],
    });

    // ⚙️ Xử lý kết quả an toàn
    try {
      const content = res.choices?.[0]?.message?.content ?? '[]';

      // Nếu AI vẫn nói nhiều, tìm phần JSON trong chuỗi
      const jsonMatch = content.match(/\[[\s\S]*\]/);
      const cleanJson = jsonMatch ? jsonMatch[0] : '[]';

      const data = JSON.parse(cleanJson);
      return Array.isArray(data) ? data : [];
    } catch (error) {
      console.error('❌ Lỗi parse JSON AI response:', error);
      return [];
    }
  }

  async getJsonResponse(prompt: string, model = 'gpt-4o-mini'): Promise<any[]> {
    try {
      const res = await this.client.chat.completions.create({
        model,
        messages: [{ role: 'user', content: prompt }],
      });

      const content = res.choices?.[0]?.message?.content ?? '';

      // Tìm phần JSON trong chuỗi nếu AI trả thêm mô tả như “Dưới đây là...”
      const jsonMatch = content.match(/\[[\s\S]*\]/);
      const cleanJson = jsonMatch ? jsonMatch[0] : '[]';

      const data = JSON.parse(cleanJson);
      return Array.isArray(data) ? data : [];
    } catch (error) {
      console.error('❌ Lỗi parse JSON AI response:', error);
      return [];
    }
  }

  // Tạo embedding cho nội dung (title + description)

  async createEmbedding(text: string): Promise<number[]> {
    try {
      const res = await this.client.embeddings.create({
        model: "text-embedding-3-small",
        input: text
      });

      return res.data[0].embedding;
    } catch (err) {
      console.error("❌ Error creating embedding:", err);
      throw new InternalServerErrorException("Embedding generation failed");
    }
  }

  // hàm tính độ tương đồng giữa 2 sản phẩm
  cosineSimilarity(a: number[], b: number[]): number {
    const dot = a.reduce((sum, val, i) => sum + val * b[i], 0);
    const normA = Math.sqrt(a.reduce((sum, val) => sum + val * val, 0));
    const normB = Math.sqrt(b.reduce((sum, val) => sum + val * val, 0));
    return dot / (normA * normB);
  }

  // recommend 5 sách liên quan nhất dựa trên embedding

  async recommendRelatedBooks(currentBook: any, allBooks: any[]) {
    if (!currentBook.embedding?.length) return [];

    const candidates = allBooks.filter(
      b => b._id.toString() !== currentBook._id.toString() && b.embedding?.length
    );

    const scored = candidates.map(b => ({
      ...b,
      score: this.cosineSimilarity(currentBook.embedding, b.embedding)
    }));

    return scored
      .sort((a, b) => (b.score ?? 0) - (a.score ?? 0))
      .slice(0, 5);
  }


  // hàm dựng prompt Ai để recommend nếu chưa có Embedding (fallback sang AI text machine)

  async recommendByAI(title: string, description: string, allBooks: any[]) {
    const prompt = `
      Dựa trên mô tả cuốn sách sau, hãy gợi ý những cuốn sách khác trong danh sách có nội dung tương tự:

      Sách cần so sánh:
      Tiêu đề: ${title}
      Mô tả: ${description}

      Danh sách toàn bộ sách (id + tiêu đề + mô tả):
      ${allBooks.map(b => `- id: ${b._id}, title: ${b.title}, desc: ${b.description || ''}`).join("\n")}

      Chỉ trả về JSON hợp lệ dạng:
      [
        { "_id": "mongoId", "title": "Tiêu đề sách" },
        ...
      ]
      Tối đa 5 sách liên quan.
    `;

    const results = await this.getJsonResponse(prompt);
    return Array.isArray(results) ? results : [];
  }
}
