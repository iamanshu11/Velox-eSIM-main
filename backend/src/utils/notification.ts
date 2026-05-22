import { db } from '../config/database'
import logger from './logger'
import cacheService from './cache'

interface NotificationPayload {
  userId: string
  type: string
  title: string
  message: string
  data?: Record<string, unknown>
  read?: boolean
}

interface CachedNotifications {
  notifications: Array<Record<string, unknown>>;
  total: number;
}

class NotificationService {
  async createNotification(payload: NotificationPayload): Promise<Record<string, unknown>> {
    try {
      const notification = await db.notification.create({
        data: {
          userId: payload.userId,
          type: payload.type,
          title: payload.title,
          message: payload.message,
          isRead: payload.read || false,
        },
      })

      await cacheService.deletePattern(`notifications:${payload.userId}:*`)

      return notification
    } catch (error) {
      logger.error('Error creating notification', error instanceof Error ? error : new Error(String(error)))
      throw error
    }
  }

  async getNotifications(
    userId: string,
    limit: number = 20,
    offset: number = 0,
    unreadOnly: boolean = false
  ): Promise<CachedNotifications> {
    try {
      const cacheKey = `notifications:${userId}:${limit}:${offset}:${unreadOnly}`

      const cached = await cacheService.get<CachedNotifications>(cacheKey)
      if (cached) {
        return cached
      }

      const where = { userId, ...(unreadOnly && { isRead: false }) }

      const [notifications, total] = await Promise.all([
        db.notification.findMany({
          where,
          orderBy: { createdAt: 'desc' },
          take: limit,
          skip: offset,
        }),
        db.notification.count({ where }),
      ])

      const result: CachedNotifications = { notifications, total }

      await cacheService.set(cacheKey, result, 300)

      return result
    } catch (error) {
      logger.error('Error getting notifications', error instanceof Error ? error : new Error(String(error)))
      throw error
    }
  }

  async getUnreadCount(userId: string): Promise<number> {
    try {
      const cacheKey = `notifications:${userId}:unread-count`

      const cached = await cacheService.get<number>(cacheKey)
      if (cached !== null) {
        return cached
      }

      const count = await db.notification.count({
        where: { userId, isRead: false },
      })

      await cacheService.set(cacheKey, count, 60)

      return count
    } catch (error) {
      logger.error('Error getting unread count', error instanceof Error ? error : new Error(String(error)))
      return 0
    }
  }

  async markAsRead(notificationId: string): Promise<void> {
    try {
      const notification = await db.notification.findUnique({
        where: { id: notificationId },
      })

      if (!notification) {
        throw new Error('Notification not found')
      }

      await db.notification.update({
        where: { id: notificationId },
        data: { isRead: true },
      })

      await cacheService.deletePattern(`notifications:${notification.userId}:*`)
    } catch (error) {
      logger.error('Error marking notification as read', error instanceof Error ? error : new Error(String(error)))
      throw error
    }
  }

  async markAllAsRead(userId: string): Promise<void> {
    try {
      await db.notification.updateMany({
        where: { userId, isRead: false },
        data: { isRead: true },
      })

      await cacheService.deletePattern(`notifications:${userId}:*`)
    } catch (error) {
      logger.error('Error marking all notifications as read', error instanceof Error ? error : new Error(String(error)))
      throw error
    }
  }

  async deleteNotification(notificationId: string): Promise<void> {
    try {
      const notification = await db.notification.findUnique({
        where: { id: notificationId },
      })

      if (!notification) {
        throw new Error('Notification not found')
      }

      await db.notification.delete({
        where: { id: notificationId },
      })

      await cacheService.deletePattern(`notifications:${notification.userId}:*`)
    } catch (error) {
      logger.error('Error deleting notification', error instanceof Error ? error : new Error(String(error)))
      throw error
    }
  }

  async deleteAllNotifications(userId: string): Promise<void> {
    try {
      await db.notification.deleteMany({
        where: { userId },
      })

      await cacheService.deletePattern(`notifications:${userId}:*`)
    } catch (error) {
      logger.error('Error deleting all notifications', error instanceof Error ? error : new Error(String(error)))
      throw error
    }
  }

  async notifyOrderStatus(orderId: string, userId: string, status: string, orderNumber: string): Promise<void> {
    const messages: Record<string, { title: string; message: string }> = {
      CONFIRMED: {
        title: 'Order Confirmed',
        message: `Your order #${orderNumber} has been confirmed and will be processed soon.`,
      },
      PROCESSING: {
        title: 'Order Processing',
        message: `Your order #${orderNumber} is being processed.`,
      },
      COMPLETED: {
        title: 'Order Completed',
        message: `Your order #${orderNumber} has been completed. Your eSIM is ready!`,
      },
      CANCELLED: {
        title: 'Order Cancelled',
        message: `Your order #${orderNumber} has been cancelled.`,
      },
    }

    const config = messages[status]
    if (config) {
      await this.createNotification({
        userId,
        type: 'ORDER_STATUS',
        title: config.title,
        message: config.message,
        data: { orderId, status },
      })
    }
  }

  async notifyPaymentStatus(
    paymentId: string,
    userId: string,
    status: string,
    amount: number
  ): Promise<void> {
    const messages: Record<string, { title: string; message: string }> = {
      COMPLETED: {
        title: 'Payment Received',
        message: `Payment of $${amount.toFixed(2)} has been received successfully.`,
      },
      FAILED: {
        title: 'Payment Failed',
        message: `Payment of $${amount.toFixed(2)} failed. Please try again.`,
      },
      REFUNDED: {
        title: 'Refund Processed',
        message: `Refund of $${amount.toFixed(2)} has been processed.`,
      },
    }

    const config = messages[status]
    if (config) {
      await this.createNotification({
        userId,
        type: 'PAYMENT_STATUS',
        title: config.title,
        message: config.message,
        data: { paymentId, status, amount },
      })
    }
  }

  async notifyeSIMStatus(eSIMId: string, userId: string, status: string, iccid: string): Promise<void> {
    const messages: Record<string, { title: string; message: string }> = {
      ACTIVATED: {
        title: 'eSIM Activated',
        message: `Your eSIM (${iccid}) has been activated and is ready to use.`,
      },
      SUSPENDED: {
        title: 'eSIM Suspended',
        message: `Your eSIM (${iccid}) has been suspended.`,
      },
      EXPIRED: {
        title: 'eSIM Expired',
        message: `Your eSIM (${iccid}) has expired.`,
      },
      DEACTIVATED: {
        title: 'eSIM Deactivated',
        message: `Your eSIM (${iccid}) has been deactivated.`,
      },
    }

    const config = messages[status]
    if (config) {
      await this.createNotification({
        userId,
        type: 'ESIM_STATUS',
        title: config.title,
        message: config.message,
        data: { eSIMId, status, iccid },
      })
    }
  }

  async notifyTicketResponse(ticketId: string, userId: string, ticketNumber: string): Promise<void> {
    await this.createNotification({
      userId,
      type: 'TICKET_UPDATE',
      title: 'Support Ticket Updated',
      message: `A new response has been added to ticket #${ticketNumber}.`,
      data: { ticketId },
    })
  }

  async notifyPromotion(userId: string, promotionTitle: string, description: string): Promise<void> {
    await this.createNotification({
      userId,
      type: 'PROMOTION',
      title: promotionTitle,
      message: description,
    })
  }
}

export default new NotificationService()

