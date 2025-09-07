import { BadRequestException, Controller, Get, Query } from "@nestjs/common";
import { AiService } from "./ai.service";

@Controller('ai')
export class AiController {
  constructor(private readonly aiService: AiService) {}

  @Get('summary')
  async getSummary(@Query('title') title: string) {
    if (!title) throw new BadRequestException('Thiếu tiêu đề sách');
    return this.aiService.generateSummary(title);
  }
}