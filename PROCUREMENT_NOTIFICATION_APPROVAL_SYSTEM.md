# Procurement Request Approval/Rejection Notification System

## Overview
Enhanced the procurement notification system to automatically send notifications to the admin who created a procurement request when their request is approved or rejected by a manager.

## Architecture Changes

### 1. Database Schema Updates

**New Field in ProcurementRequest:**
```prisma
model ProcurementRequest {
  ...
  requestedByUserId String?
  requestedByUser   User?     @relation("ProcurementRequests", fields: [requestedByUserId], references: [id], onDelete: SetNull)
  ...
}
```

**Updated User Model:**
```prisma
model User {
  ...
  procurementRequests    ProcurementRequest[]  @relation("ProcurementRequests")
}
```

### 2. New Service Method

**NotificationsService:**
Added `sendNotificationToUser()` method to send notifications to a specific user:

```typescript
async sendNotificationToUser(userId: string, notificationData: NotificationData): Promise<any>
```

Parameters:
- `userId`: ID of the user to notify
- `notificationData`: Object containing `title`, `message`, and `type`

Returns:
```json
{
  "success": true,
  "notification": {
    "id": "uuid",
    "userId": "uuid",
    "title": "...",
    "message": "...",
    "type": "...",
    "isRead": false,
    "createdAt": "iso-timestamp"
  }
}
```

### 3. ProcurementService Updates

**Enhanced Methods:**

#### `create()` - Creates new procurement request
- Already sends notification to all MANAGERS
- When creating, store `requestedByUserId` from the authenticated user

#### `update()` - Updates procurement request status
- Detects status changes to APPROVED or REJECTED
- Sends notification to the `requestedByUserId`
- Only notifies if status actually changed

#### `approveRequest()` - Manager approves a procurement request
- Updates status to APPROVED
- Sends notification to admin: 
  - **Title:** "Procurement Request Approved"
  - **Message:** "Your procurement request for {quantity} {itemName} has been approved by the Manager."
  - **Type:** "PROCUREMENT_APPROVED"
- Creates assets if specified

#### `rejectRequest()` - Manager rejects a procurement request
- Updates status to REJECTED
- Sends notification to admin:
  - **Title:** "Procurement Request Rejected"
  - **Message:** "Your procurement request for {quantity} {itemName} has been rejected by the Manager."
  - **Type:** "PROCUREMENT_REJECTED"

## Workflow Scenarios

### Scenario 1: Admin Creates Procurement Request

```
1. Admin calls POST /procurement/requests with payload:
   {
     "itemName": "Laptops",
     "quantity": 5,
     "estimatedCost": 500000,
     "category": "IT Equipment",
     "vendor": "Dell",
     "requestedBy": "Admin Name",
     "status": "PENDING"
   }

2. Backend:
   - Creates procurement request in DB with status "Pending"
   - **Stores requestedByUserId from JWT token**
   - Sends notification to ALL managers:
     - Title: "New Procurement Request"
     - Message: "Admin Admin Name has submitted a procurement request for 5 Laptops."
     - Type: "PROCUREMENT_REQUEST"

3. Result: All managers see a new notification in their bell icon
```

### Scenario 2: Manager Approves Request

```
1. Manager calls PATCH /procurement/requests/:id with payload:
   {
     "status": "APPROVED"
   }

2. Backend:
   - Updates procurement request status to APPROVED
   - Retrieves requestedByUserId from the procurement request
   - Sends notification to THAT SPECIFIC ADMIN:
     - Title: "Procurement Request Approved"
     - Message: "Your procurement request for 5 Laptops has been approved by the Manager."
     - Type: "PROCUREMENT_APPROVED"
   - Auto-creates assets for each quantity
   - Creates lifecycle entries

3. Result: The admin who created the request gets a notification
           Assets are created and ready for use
```

### Scenario 3: Manager Rejects Request

```
1. Manager calls PATCH /procurement/requests/:id with payload:
   {
     "status": "REJECTED"
   }

2. Backend:
   - Updates procurement request status to REJECTED
   - Retrieves requestedByUserId from the procurement request
   - Sends notification to THAT SPECIFIC ADMIN:
     - Title: "Procurement Request Rejected"
     - Message: "Your procurement request for 5 Laptops has been rejected by the Manager."
     - Type: "PROCUREMENT_REJECTED"

3. Result: The admin who created the request gets a rejection notification
```

## API Endpoints

### Create Procurement Request
```
POST /procurement/requests
Authorization: Bearer <token>
Content-Type: application/json

Body:
{
  "itemName": "string",
  "category": "string",
  "quantity": number,
  "estimatedCost": number,
  "vendor": "string",
  "requestedBy": "string (user name)",
  "justification": "string",
  "priority": "string"
}

Note: Backend MUST capture the authenticated user's ID as requestedByUserId
```

### Update Procurement Request Status
```
PATCH /procurement/requests/:id
Authorization: Bearer <token>
Content-Type: application/json

Body:
{
  "status": "APPROVED" | "REJECTED"
}

Response:
{
  "id": "uuid",
  "itemName": "Laptops",
  "quantity": 5,
  "status": "APPROVED",
  "requestedBy": "Admin Name",
  "requestedByUserId": "uuid",
  ...
}
```

### Get Notifications
```
GET /notifications/unread
Authorization: Bearer <token>

Response:
[
  {
    "id": "uuid",
    "userId": "uuid",
    "title": "Procurement Request Approved",
    "message": "Your procurement request for 5 Laptops has been approved by the Manager.",
    "type": "PROCUREMENT_APPROVED",
    "isRead": false,
    "createdAt": "2026-03-16T10:30:00Z"
  }
]
```

## Database Migrations

**Migration 1:** `20260316044927_add_notifications_table`
- Created notifications table

**Migration 2:** `20260316051031_add_procurement_user_relation`
- Added `requestedByUserId` field to ProcurementRequest
- Added FK relationship to User model
- On User delete: requestedByUserId set to NULL

## Implementation Checklist

- ✅ Added `requestedByUserId` field to ProcurementRequest model
- ✅ Created foreign key relationship with User
- ✅ Added `sendNotificationToUser()` method to NotificationsService
- ✅ Updated `create()` method to store `requestedByUserId` based on authenticated user
- ✅ Updated `update()` method to send notifications on status change
- ✅ Updated `approveRequest()` method to send approval notification
- ✅ Updated `rejectRequest()` method to send rejection notification
- ✅ Created database migrations
- ✅ Error handling to not block operations if notifications fail

## Frontend Implementation Notes

### When Creating Procurement Request

The backend now expects the authenticated user's ID to be captured. With the current JWT implementation, the backend can extract this from the JWT token. The frontend just needs to:

```typescript
// The backend will automatically capture the authenticated user ID
POST /procurement/requests
{...procurement data...}
// Backend extracts userId from JWT token and stores as requestedByUserId
```

### Displaying Status Change Notifications

When a manager approves/rejects a request, the admin can see the notification:

1. Fetch unread notifications: `GET /notifications/unread`
2. Filter by type: `PROCUREMENT_APPROVED` or `PROCUREMENT_REJECTED`
3. Display in the notification bell/dropdown
4. Show action: "Laptop request approved by Manager" with timestamp
5. Mark as read when clicked

### Error Handling

If notification sending fails:
- The procurement request operation completes successfully
- Error is logged to console
- Operation is NOT blocked
- User can still see the request status update

## Testing Workflow

1. **Create a user with ADMIN role**
   - Sign up or use admin credentials
   - Extract user ID from JWT token

2. **Create a user with MANAGER role**
   - Different user account

3. **Admin creates procurement request**
   - POST /procurement/requests
   - Backend stores admin's user ID as requestedByUserId

4. **Manager views unread notifications**
   - GET /notifications/unread
   - Should see "New Procurement Request" notification

5. **Manager approves request**
   - PATCH /procurement/requests/:id with {"status": "APPROVED"}

6. **Admin views unread notifications**
   - GET /notifications/unread
   - Should see "Procurement Request Approved" notification

7. **Verify notification details**
   - Title: "Procurement Request Approved"
   - Message: "Your procurement request for X {itemName} has been approved by the Manager."
   - Type: "PROCUREMENT_APPROVED"
   - isRead: false

## Key Points

1. **Notifications Only to Creator**: When approving/rejecting, only the admin who created the request gets notified
2. **Creation Notifications to Managers**: When a request is created, ALL managers get notified
3. **No Duplicate Notifications**: Each status change only triggers once (change detection)
4. **Async & Non-Blocking**: Notifications are sent asynchronously, don't block main operation
5. **User ID Required**: Must capture authenticated user's ID when creating request
6. **Type Differentiation**: Different notification types (PROCUREMENT_APPROVED vs PROCUREMENT_REJECTED) allow frontend to show different icons/colors

## Future Enhancements

1. **Email Notifications**: Send emails in addition to in-app notifications
2. **Notification History**: Archive old notifications separately
3. **Notification Preferences**: Allow users to disable certain notification types
4. **Bulk Operations**: Handle multiple procurements in one batch
5. **WebSocket Real-time**: Push notifications in real-time instead of polling
6. **Notification Templates**: Customize notification messages per organization
