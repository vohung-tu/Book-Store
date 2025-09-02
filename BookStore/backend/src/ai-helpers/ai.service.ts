import { Injectable } from '@nestjs/common';
import OpenAI from 'openai';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class AiService {
  private client: OpenAI;

  constructor(private configService: ConfigService) {
    this.client = new OpenAI({
      baseURL: 'https://openrouter.ai/api/v1',
      apiKey: this.configService.get<string>('OPENROUTER_API_KEY'), // lấy từ .env
    });
  }

  async generateSummary(title: string, description: string): Promise<string> {
    const prompt = `Viết tóm tắt ngắn (3–5 câu) cho sách:
Tiêu đề: ${title}
Mô tả: ${description}`;

    try {
      const res = await this.client.chat.completions.create({
        model: 'openai/gpt-4o-mini', //  nhớ chọn model có trong OpenRouter
        messages: [{ role: 'user', content: prompt }],
      });
      return res.choices[0].message?.content?.trim() ?? '';
    } catch (err) {
      console.error('❌ AI summary error:', err);
      throw err;
    }
  }
}
