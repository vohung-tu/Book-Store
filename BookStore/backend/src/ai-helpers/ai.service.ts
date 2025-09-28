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

}
