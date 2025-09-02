import { Injectable } from '@nestjs/common';
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
    });
  }

  async generateSummary(title: string, description: string): Promise<string> {
    const prompt = `Viết tóm tắt ngắn (3–5 câu) cho sách:
Tiêu đề: ${title}
Mô tả: ${description}`;

    const res = await this.client.chat.completions.create({
      model: 'openai/gpt-4o-mini',
      messages: [{ role: 'user', content: prompt }],
    });

    return res.choices[0].message?.content?.trim() ?? '';
  }
}

