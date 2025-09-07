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

  async generateSummary(title: string): Promise<string> {
    const prompt = `Bạn là trợ lý nội dung sách; 
Viết tóm tắt ngắn gọn (3–5 câu) cho tiêu đề: "${title}" để mô tả hấp dẫn và dễ hiểu.`;

    try {
      const res = await this.client.chat.completions.create({
        model: 'openrouter/openai/gpt-4o-mini',
        messages: [{ role: 'user', content: prompt }],
      });

      console.log('✅ AI response:', JSON.stringify(res, null, 2));
      return res.choices[0].message?.content?.trim() ?? '';
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
