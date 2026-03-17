# Notification System Implementation

## Overview
A complete notification system has been implemented in the NestJS backend to handle notifications for procurement requests and other system events.

## Files Created

### 1. **src/notifications/notifications.service.ts**
The core service for managing notifications with the following methods:

- **`sendNotificationToRole(role, notificationData)`** - Main method that:
  - Fetches all users with a specified role (ADMIN, MANAGER, USER)
  - Creates notifications for each user
  - Returns success status and created notifications

- **`getUnreadNotifications(userId)`** - Get all unread notifications for a user
- **`getAllNotifications(userId, limit?)`** - Get all notifications (up to limit)
- **`markAsRead(notificationId)`** - Mark a single notification as read
- **`markAllAsRead(userId)`** - Mark all notifications as read for a user
- **`deleteNotification(notificationId)`** - Delete a specific notification
- **`deleteAllNotifications(userId)`** - Delete all notifications for a user

### 2. **src/notifications/notifications.controller.ts**
REST API endpoints for notification management:

- `GET /notifications/unread` - Get unread notifications for current user
- `GET /notifications` - Get all notifications with optional limit query parameter
- `PATCH /notifications/:id/read` - Mark notification as read
- `PATCH /notifications/mark-all-read` - Mark all notifications as read
- `DELETE /notifications/:id` - Delete a notification
- `DELETE /notifications` - Delete all notifications for user

### 3. **src/notifications/notifications.module.ts**
NestJS module that:
- Imports PrismaModule (database access)
- Provides NotificationsService
- Exports NotificationsService for use in other modules

### 4. **prisma/schema.prisma** (Updated)
Added:
- **Notification model** with fields:
  - `id` (UUID, primary key)
  - `userId` (FK to User, with onDelete CASCADE)
  - `title` (String)
  - `message` (String)
  - `type` (String) - e.g., "PROCUREMENT_REQUEST"
  - `isRead` (Boolean, default: false)
  - `createdAt` (DateTime)
  - `updatedAt` (DateTime)

- **User model** relationship update:
  - Added `notifications` relation to Notification model

### 5. **Database Migration**
- Migration: `20260316044927_add_notifications_table`
- Creates the notifications table with proper indexes and foreign key constraints

## Files Modified

### 1. **src/procurement/procurement.service.ts**
- Added NotificationsService injection
- Updated `create()` method to:
  1. Create the procurement request
  2. Call `notificationsService.sendNotificationToRole('MANAGER', {...})`
  3. Sends notification to all managers with message format:
     ```
     Title: "New Procurement Request"
     Message: "Admin {requestedBy} has submitted a procurement request for {quantity} {itemName}."
     Type: "PROCUREMENT_REQUEST"
     ```

### 2. **src/procurement/procurement.module.ts**
- Added import of NotificationsModule

### 3. **src/app.module.ts**
- Added NotificationsModule to imports

## Usage Example

### Workflow: Creating a Procurement Request

When an Admin creates a procurement request via `POST /procurement/requests`:

```json
{
  "itemName": "Chairs",
  "category": "movable-assets",
  "assetType": "Office Furniture",
  "quantity": 2,
  "estimatedCost": 7500000000,
  "vendor": "juhn",
  "justification": "vhbjnk",
  "priority": "medium",
  "requestedBy": "priya sharma",
  "status": "PENDING"
}
```

**Automatic notification creation:**
1. Procurement request is created with status "Pending"
2. All users with role "MANAGER" receive a notification with:
   - Title: `"New Procurement Request"`
   - Message: `"Admin priya sharma has submitted a procurement request for 2 Chairs."`
   - Type: `"PROCUREMENT_REQUEST"`
   - isRead: `false`

### Managing Notifications

**Get unread notifications:**
```
GET /notifications/unread
Authorization: Bearer <token>
```

**Get all notifications:**
```
GET /notifications?limit=20
Authorization: Bearer <token>
```

**Mark as read:**
```
PATCH /notifications/:id/read
Authorization: Bearer <token>
```

**Mark all as read:**
```
PATCH /notifications/mark-all-read
Authorization: Bearer <token>
```

**Delete notification:**
```
DELETE /notifications/:id
Authorization: Bearer <token>
```

## Database Schema

### Notifications Table
```sql
CREATE TABLE "Notification" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "userId" TEXT NOT NULL,
  "title" TEXT NOT NULL,
  "message" TEXT NOT NULL,
  "type" TEXT NOT NULL,
  "isRead" BOOLEAN NOT NULL DEFAULT false,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "Notification_userId_fkey" 
    FOREIGN KEY ("userId") 
    REFERENCES "User" ("id") 
    ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE INDEX "Notification_userId_idx" ON "Notification"("userId");
```

## Best Practices Implemented

1. **Error Handling**: Notifications don't block procurement request creation if they fail
2. **Database Integrity**: Cascade delete - notifications are deleted when user is deleted
3. **Scalability**: Efficient query patterns for fetching notifications
4. **Security**: All endpoints protected with JWT authentication and role-based guards
5. **Clean Architecture**: Service-based organization with clear separation of concerns
6. **Type Safety**: Full TypeScript support

## Future Enhancements

1. **Notification Preferences**: Allow users to opt-in/out of certain notification types
2. **Email Notifications**: Send email notifications in addition to in-app
3. **Notification Categories**: Organize notifications by type (Procurement, Maintenance, etc.)
4. **Real-time Updates**: Implement WebSocket for real-time notification delivery
5. **Notification Templates**: Use template system for consistent message formatting
6. **Bulk Operations**: Add batch notification creation for system-wide announcements

## Testing the Implementation

1. Run the application: `npm run start`
2. Create a user with role "MANAGER"
3. Make a POST request to create a procurement request with an ADMIN account
4. Query the notifications table or use the API endpoints to verify notifications were created
