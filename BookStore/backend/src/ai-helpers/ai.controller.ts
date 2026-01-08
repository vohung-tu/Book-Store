import { BadRequestException, Body, Controller, Get, Post, Query } from "@nestjs/common";
import { AiService } from "./ai.service";

@Controller('ai')
export class AiController {
  constructor(private readonly aiService: AiService) {}

  @Post('chat')
  async chat(@Body('message') message: string) {
    if (!message?.trim()) {
      throw new BadRequestException('Tin nhắn không hợp lệ');
    }

    const reply = await this.aiService.chat(message);

    return { reply };
  }

  @Get('summary')
  async getSummary(@Query('title') title: string) {
    if (!title) throw new BadRequestException('Thiếu tiêu đề sách');
    return this.aiService.generateSummary(title);
  }
}