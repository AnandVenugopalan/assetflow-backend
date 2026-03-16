import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { UserRole } from '@prisma/client';

export interface NotificationData {
  title: string;
  message: string;
  type: string;
}

@Injectable()
export class NotificationsService {
  constructor(private prisma: PrismaService) {}

  /**
   * Send notification to all users with a specific role
   * @param role - The role of users to notify (e.g., "MANAGER", "ADMIN")
   * @param notificationData - The notification data containing title, message, and type
   */
  async sendNotificationToRole(
    role: 'ADMIN' | 'MANAGER' | 'USER',
    notificationData: NotificationData,
  ): Promise<any> {
    // Fetch all users with the specified role
    const users = await this.prisma.user.findMany({
      where: {
        role: role as UserRole,
      },
      select: { id: true },
    });

    if (!users || users.length === 0) {
      return { success: true, notificationsCreated: 0, message: 'No users found with the specified role' };
    }

    // Create notifications for each user
    const notifications = await Promise.all(
      users.map((user) =>
        this.prisma.notification.create({
          data: {
            userId: user.id,
            title: notificationData.title,
            message: notificationData.message,
            type: notificationData.type,
            isRead: false,
          },
        }),
      ),
    );

    return {
      success: true,
      notificationsCreated: notifications.length,
      notifications,
    };
  }

  /**
   * Send notification to a specific user
   * @param userId - The ID of the user to notify
   * @param notificationData - The notification data containing title, message, and type
   */
  async sendNotificationToUser(
    userId: string,
    notificationData: NotificationData,
  ): Promise<any> {
    // Verify user exists
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { id: true },
    });

    if (!user) {
      return { success: false, message: 'User not found' };
    }

    // Create notification for the user
    const notification = await this.prisma.notification.create({
      data: {
        userId,
        title: notificationData.title,
        message: notificationData.message,
        type: notificationData.type,
        isRead: false,
      },
    });

    return {
      success: true,
      notification,
    };
  }

  /**
   * Get all unread notifications for a user
   */
  async getUnreadNotifications(userId: string): Promise<any> {
    return this.prisma.notification.findMany({
      where: {
        userId,
        isRead: false,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  /**
   * Get all notifications for a user (read and unread)
   */
  async getAllNotifications(userId: string, limit: number = 20): Promise<any> {
    return this.prisma.notification.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });
  }

  /**
   * Mark a notification as read
   */
  async markAsRead(notificationId: string): Promise<any> {
    return this.prisma.notification.update({
      where: { id: notificationId },
      data: { isRead: true },
    });
  }

  /**
   * Mark all notifications as read for a user
   */
  async markAllAsRead(userId: string): Promise<any> {
    return this.prisma.notification.updateMany({
      where: { userId, isRead: false },
      data: { isRead: true },
    });
  }

  /**
   * Delete a notification
   */
  async deleteNotification(notificationId: string): Promise<any> {
    return this.prisma.notification.delete({
      where: { id: notificationId },
    });
  }

  /**
   * Delete all notifications for a user
   */
  async deleteAllNotifications(userId: string): Promise<any> {
    return this.prisma.notification.deleteMany({
      where: { userId },
    });
  }
}
