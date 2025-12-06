import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Notification, NotificationDocument } from './schemas/notification.schema';
import { CreateNotificationDto } from './dto/create-notification.dto';

@Injectable()
export class NotificationService {
  constructor(
    @InjectModel(Notification.name)
    private notificationModel: Model<NotificationDocument>,
  ) {}

  async create(dto: CreateNotificationDto) {
    const created = new this.notificationModel({
      ...dto,
      userId: dto.userId.toString(), 
      isRead: false,
    });
    return created.save();
  }

  async getUserNotifications(userId: string, limit = 20) {
    return this.notificationModel
      .find({ userId: userId.toString() })
      .sort({ createdAt: -1 })
      .limit(limit)
      .lean();
  }

  async getUnreadCount(userId: string) {
    return this.notificationModel.countDocuments({
      userId: userId.toString(),
      isRead: false,
    });
  }

  async markAsRead(id: string, userId: string) {
    const notification = await this.notificationModel.findOne({
      _id: id,
      userId: userId.toString(),
    });

    if (!notification) {
      throw new NotFoundException('Notification not found');
    }

    if (!notification.isRead) {
      notification.isRead = true;
      await notification.save();
    }

    return notification;
  }

  async markAllAsRead(userId: string) {
    await this.notificationModel.updateMany(
      { 
        userId: userId.toString(),
        isRead: false 
      },
      { $set: { isRead: true } },
    );
    return { success: true };
  }
}
