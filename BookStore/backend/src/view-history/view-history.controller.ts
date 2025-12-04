import { Controller, Post, Body, Get, Param } from '@nestjs/common';
import { ViewHistoryService } from './view-history.service';

@Controller('view-history')
export class ViewHistoryController {
  constructor(private viewHistoryService: ViewHistoryService) {}

  @Post('record')
  async record(@Body() body: { userId: string; bookId: string }) {
    const { userId, bookId } = body;
    await this.viewHistoryService.recordView(userId, bookId);
    return { message: 'ok' };
  }

  @Get(':userId')
  async getRecent(@Param('userId') userId: string) {
    return await this.viewHistoryService.getRecentViews(userId);
  }
}
