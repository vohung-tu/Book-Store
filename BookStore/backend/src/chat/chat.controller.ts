import { Controller, Post, Get, Body, Req, UseGuards } from '@nestjs/common';
import { ChatService } from './chat.service';
import { JwtAuthGuard } from 'src/users/auth/jwt.auth.guard';

@Controller('chat')
@UseGuards(JwtAuthGuard)
export class ChatController {
  constructor(private readonly chatService: ChatService) {}

  @Post()
  async chat(@Body('message') message: string, @Req() req: any) {
    const userId = req.user?.sub || req.user?.id;
    await this.chatService.saveMessage(userId, 'user', message);
    return this.chatService.handleMessage(message, userId);
  }

  @Get('history')
  async getHistory(@Req() req: any) {
    const userId = req.user?.sub || req.user?.id;
    if (!userId) return []; // chưa login
    return this.chatService.getHistory(userId);
  }

  @Get('welcome')
  async getWelcome(@Req() req: any) {
    const userId = req.user?.sub || req.user?.id;
    return this.chatService.getWelcomeMessage(userId);
  }
}
