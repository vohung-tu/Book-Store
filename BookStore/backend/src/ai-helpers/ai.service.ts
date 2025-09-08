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
  const prompt = `Bạn là một biên tập viên giới thiệu sách chuyên nghiệp (giống như Tiki). 
Hãy viết phần mô tả sách với cấu trúc sau:

1. Mở đầu: Viết 1–2 câu ngắn gợi cảm xúc, có thể đặt câu hỏi để thu hút độc giả.
2. Nội dung: Viết đoạn văn 4–6 câu tóm tắt cốt truyện hoặc ý chính của sách, ngắn gọn và dễ hiểu.
3. Điểm nổi bật: Liệt kê 3–4 gạch đầu dòng những giá trị hoặc lợi ích mà cuốn sách mang lại cho độc giả.
4. Tác giả: Viết 1–2 câu giới thiệu ngắn về tác giả (nếu có thông tin).

Tiêu đề sách: "${title}" 
${description ? `Mô tả thêm: ${description}` : ''}`;

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

}
