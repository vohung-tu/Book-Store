import { Injectable } from '@nestjs/common';
import OpenAI from 'openai';

@Injectable()
export class AiService {
  private client = new OpenAI({
    baseURL: 'https://openrouter.ai/api/v1', 
    apiKey: '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',
  });

  async generateSummary(title: string, description: string): Promise<string> {
    const prompt = `Viết tóm tắt ngắn (3–5 câu) cho sách:
Tiêu đề: ${title}
Mô tả: ${description}`;

    const res = await this.client.chat.completions.create({
      model: 'openai/gpt-4o', 
      messages: [{ role: 'user', content: prompt }],
    });

    return res.choices[0].message?.content ?? '';
  }
}
