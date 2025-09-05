import { Injectable, InternalServerErrorException } from '@nestjs/common';
import OpenAI from 'openai';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class AiService {
  private client: OpenAI;

  constructor(private configService: ConfigService) {
    const apiKey = this.configService.get<string>('OPENROUTER_API_KEY'); // should match env
    console.log('🔑 API Key loaded?', apiKey ? '✅ Có key' : '❌ Không có key');

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

  async generateSummary(title: string): Promise<string> {
    const prompt = `Bạn là trợ lý nội dung sách; 
Viết tóm tắt ngắn gọn (3–5 câu) cho tiêu đề: "${title}" để mô tả hấp dẫn và dễ hiểu.`;

    try {
      const res = await this.client.chat.completions.create({
        model: 'openai/gpt-5-mini', // sử dụng GPT-5-mini
        messages: [{ role: 'user', content: prompt }],
      });

      console.log('✅ AI response snippet:', res.choices[0].message?.content?.slice(0, 100));
      return res.choices[0].message?.content?.trim() ?? '';
    } catch (err: any) {
      console.error('❌ AI summary error:', err.response?.data || err.message);
      throw new InternalServerErrorException('Không thể tạo tóm tắt AI');
    }
  }
}
