import { Injectable } from '@nestjs/common';
import OpenAI from 'openai';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class AiService {
  private client: OpenAI;

  constructor(private configService: ConfigService) {
    const apiKey = this.configService.get<string>('OPENROUTER_API_KEY');
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

    try {
    const res = await this.client.chat.completions.create({
      model: 'openai/gpt-4o-mini',
      messages: [{ role: 'user', content: prompt }],
    });

    // In ra log để debug trên Render
    console.log('✅ AI response:', JSON.stringify(res, null, 2));

    return res.choices[0].message?.content?.trim() ?? '';
  } catch (err: any) {
    // Log chi tiết lỗi từ OpenRouter
    if (err.response) {
      console.error('❌ AI summary error response:', err.response.status, err.response.data);
    } else {
      console.error('❌ AI summary error:', err.message || err);
    }
    throw new Error('AI summary generation failed');
  }
  }
}

