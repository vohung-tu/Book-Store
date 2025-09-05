import { Injectable } from '@nestjs/common';
import OpenAI from 'openai';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class AiService {
  private client: OpenAI;

  constructor(private configService: ConfigService) {
    const apiKey = this.configService.get<string>('OPENROUTER_API_KEY');
    console.log('🔑 API Key loaded?', apiKey ? '✅ Có key' : '❌ Không có key');

    this.client = new OpenAI({
      baseURL: 'https://openrouter.ai/api/v1',
      apiKey,
    });
  }

  async generateSummary(title: string): Promise<string> {
    const prompt = `Bạn là một trợ lý sách thông minh.
  Hãy viết một đoạn tóm tắt ngắn gọn (3–5 câu) giới thiệu cuốn sách với tiêu đề:
  "${title}"
  Hãy tập trung vào ý nghĩa chính và lợi ích cho độc giả, viết văn phong tự nhiên, dễ hiểu.`;

    try {
      const res = await this.client.chat.completions.create({
        model: 'openai/gpt-4o-mini',
        messages: [{ role: 'user', content: prompt }],
      });

      return res.choices[0].message?.content?.trim() ?? '';
    } catch (err) {
      console.error('❌ AI summary error:', err.response?.data || err.message);
      throw err;
    }
  }
}
