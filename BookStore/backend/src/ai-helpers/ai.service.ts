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

      // ✅ Tìm phần JSON trong chuỗi nếu AI trả thêm mô tả như “Dưới đây là...”
      const jsonMatch = content.match(/\[[\s\S]*\]/);
      const cleanJson = jsonMatch ? jsonMatch[0] : '[]';

      const data = JSON.parse(cleanJson);
      return Array.isArray(data) ? data : [];
    } catch (error) {
      console.error('❌ Lỗi parse JSON AI response:', error);
      return [];
    }
  }

}
