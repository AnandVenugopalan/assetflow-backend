import {
  Controller,
  Get,
  Patch,
  Delete,
  Param,
  UseGuards,
  HttpException,
  HttpStatus,
  Query,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { RolesGuard } from '../users/roles.guard';
import { NotificationsService } from './notifications.service';
import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { Request } from 'express';

export const CurrentUser = createParamDecorator(
  (data: unknown, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest<Request>();
    return request.user as { userId: string; email: string; role: string };
  },
);

@Controller('notifications')
@UseGuards(AuthGuard('jwt'), RolesGuard)
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  @Get('unread')
  async getUnreadNotifications(@CurrentUser() user: { userId: string }) {
    try {
      return await this.notificationsService.getUnreadNotifications(user.userId);
    } catch (error) {
      throw new HttpException('Failed to fetch unread notifications', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  @Get()
  async getAllNotifications(
    @CurrentUser() user: { userId: string },
    @Query('limit') limit?: string,
  ) {
    try {
      const limitNum = limit ? parseInt(limit, 10) : 20;
      return await this.notificationsService.getAllNotifications(user.userId, limitNum);
    } catch (error) {
      throw new HttpException('Failed to fetch notifications', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  @Patch(':id/read')
  async markAsRead(@Param('id') id: string) {
    try {
      return await this.notificationsService.markAsRead(id);
    } catch (error) {
      throw new HttpException('Failed to mark notification as read', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  @Patch('mark-all-read')
  async markAllAsRead(@CurrentUser() user: { userId: string }) {
    try {
      return await this.notificationsService.markAllAsRead(user.userId);
    } catch (error) {
      throw new HttpException('Failed to mark all notifications as read', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  @Delete(':id')
  async deleteNotification(@Param('id') id: string) {
    try {
      return await this.notificationsService.deleteNotification(id);
    } catch (error) {
      throw new HttpException('Failed to delete notification', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  @Delete()
  async deleteAllNotifications(@CurrentUser() user: { userId: string }) {
    try {
      return await this.notificationsService.deleteAllNotifications(user.userId);
    } catch (error) {
      throw new HttpException('Failed to delete all notifications', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }
}
