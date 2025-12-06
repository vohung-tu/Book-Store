import {
  Controller,
  Get,
  Patch,
  Param,
  Req,
  UseGuards,
  Query,
} from '@nestjs/common';
import { NotificationService } from './notification.service';
import { JwtAuthGuard } from 'src/users/auth/jwt.auth.guard';

@Controller('notifications')
@UseGuards(JwtAuthGuard)
export class NotificationController {
  constructor(private readonly notificationService: NotificationService) {}

  @Get()
  async getMyNotifications(
    @Req() req,
    @Query('limit') limit?: string,
  ) {
    const userId = req.user._id.toString();
    const parsedLimit = limit ? parseInt(limit, 10) : 20;
    return this.notificationService.getUserNotifications(userId, parsedLimit);
  }

  @Get('unread-count')
  async getUnreadCount(@Req() req) {
    const userId = req.user._id.toString();
    const count = await this.notificationService.getUnreadCount(userId);
    return { count };
  }

  @Patch(':id/read')
  async markAsRead(@Req() req, @Param('id') id: string) {
    const userId = req.user._id.toString();
    return this.notificationService.markAsRead(id, userId);
  }

  @Patch('mark-all-read')
  async markAllAsRead(@Req() req) {
    const userId = req.user._id.toString();
    return this.notificationService.markAllAsRead(userId);
  }
}
