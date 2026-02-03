# Study Assistance Backend - API Documentation

## Base URL
```
http://localhost:3000/api
```

## Authentication
All protected endpoints require a Firebase ID token in the Authorization header:
```
Authorization: Bearer <firebase-id-token>
```

---

## API Endpoints

### 🏥 Health Check
- **GET** `/health` - Check server status

### 👤 User Management
- **GET** `/api/users/profile` - Get current user profile
- **PUT** `/api/users/profile` - Update user profile
- **GET** `/api/users/current-plan` - Get active subscription

### 💳 Plans & Subscriptions
- **GET** `/api/plans` - Get all available plans
- **POST** `/api/plans` - Create new plan (Admin only)
- **POST** `/api/plans/purchase` - Purchase a plan
- **GET** `/api/plans/purchases` - Get purchase history

### 📚 Notes Marketplace
- **GET** `/api/notes` - Get all approved notes
- **GET** `/api/notes/:id` - Get note details
- **POST** `/api/notes` - Create new note
- **PUT** `/api/notes/:id` - Update note
- **POST** `/api/notes/purchase` - Purchase a note
- **GET** `/api/notes/my-purchases` - Get purchased notes
- **GET** `/api/notes/my-sales` - Get sales as seller
- **PATCH** `/api/notes/:id/approve` - Approve note (Admin only)

### 📝 Mock Tests
- **GET** `/api/mock-tests` - Get all mock tests
- **GET** `/api/mock-tests/:id` - Get mock test with questions
- **POST** `/api/mock-tests` - Create mock test (Admin/Teacher)
- **POST** `/api/mock-tests/submit` - Submit test attempt
- **GET** `/api/mock-tests/attempts` - Get my attempts
- **GET** `/api/mock-tests/attempts/:id` - Get attempt details

### 🤖 AI Features (Document RAG System)
- **POST** `/api/ai/documents/upload` - Upload PDF document for processing
- **GET** `/api/ai/documents` - Get all user documents
- **GET** `/api/ai/documents/:id` - Get single document details
- **DELETE** `/api/ai/documents/:id` - Delete document
- **POST** `/api/ai/ask` - Ask question about documents (RAG)
- **POST** `/api/ai/documents/:id/summarize` - Summarize document
- **POST** `/api/ai/documents/:id/generate-questions` - Generate practice questions
- **POST** `/api/ai/evaluate` - Evaluate user answer
- **POST** `/api/ai/chat` - General AI chat
- **POST** `/api/ai/search` - Search documents
- **GET** `/api/ai/usage` - Get AI usage statistics

### 🔔 Notifications
- **POST** `/api/notifications/device-token` - Register FCM token
- **DELETE** `/api/notifications/device-token` - Remove FCM token
- **GET** `/api/notifications` - Get notifications
- **PATCH** `/api/notifications/read` - Mark as read
- **PATCH** `/api/notifications/read-all` - Mark all as read

### 👨‍💼 Admin
- **GET** `/api/admin/dashboard` - Get dashboard stats
- **GET** `/api/admin/revenue` - Get revenue statistics
- **GET** `/api/admin/users/stats` - Get user statistics
- **GET** `/api/admin/users` - Get all users
- **PATCH** `/api/admin/users/:userId/role` - Update user role
- **GET** `/api/admin/pending` - Get pending approvals
- **GET** `/api/admin/metrics` - Get metric history

---

## Example Requests

### Purchase a Plan
```json
POST /api/plans/purchase
{
  "planId": "plan-uuid",
  "paymentTxnId": "txn_123456",
  "provider": "razorpay"
}
```

### Create a Note
```json
POST /api/notes
{
  "title": "Complete JEE Physics Notes",
  "subject": "Physics",
  "examType": "JEE",
  "description": "Comprehensive notes covering all topics",
  "price": 299,
  "fileUrl": "https://storage.example.com/notes/physics.pdf",
  "thumbnailUrl": "https://storage.example.com/thumbnails/physics.jpg"
}
```

### Submit AI Request
```json
POST /api/ai/ask
{
  "question": "What are the main concepts covered in my documents?",
  "documentId": "optional-document-uuid"
}
```

### Upload PDF Document
```bash
curl -X POST http://localhost:3000/api/ai/documents/upload \
  -H "Authorization: Bearer <token>" \
  -F "file=@/path/to/document.pdf" \
  -F "title=My Study Notes"
```

### Chat with AI
```json
POST /api/ai/chat
{
  "message": "Help me understand photosynthesis",
  "history": [
    {"role": "user", "content": "Previous question"},
    {"role": "assistant", "content": "Previous answer"}
  ]
}
```

### Evaluate Answer
```json
POST /api/ai/evaluate
{
  "question": "What is photosynthesis?",
  "answer": "Photosynthesis is the process by which plants convert sunlight into energy.",
  "documentId": "optional-document-uuid"
}
```

### Submit Mock Test
```json
POST /api/mock-tests/submit
{
  "mockTestId": "test-uuid",
  "timeTaken": 3600,
  "answers": {
    "question-id-1": "B",
    "question-id-2": "A"
  }
}
```

---

## Error Responses

All errors follow this format:
```json
{
  "status": "error",
  "message": "Error description"
}
```

Common HTTP status codes:
- `400` - Bad Request
- `401` - Unauthorized
- `403` - Forbidden
- `404` - Not Found
- `429` - Too Many Requests (Rate Limit)
- `500` - Internal Server Error

---

## Query Parameters

### Pagination
Most list endpoints support pagination:
- `page` - Page number (default: 1)
- `limit` - Items per page (default: 20)

### Filtering
- Notes: `subject`, `examType`, `minPrice`, `maxPrice`
- Mock Tests: `subject`, `examType`, `difficulty`
- AI History: `featureType`

---

## Rate Limiting

AI requests are limited based on the user's plan:
- FREE: 5 requests/day
- BASIC: 20 requests/day
- PREMIUM: 50 requests/day
- ULTIMATE: 200 requests/day

---

## Webhooks & Background Jobs

### Escrow Release
Automatic escrow release after 48 hours (configurable)

### Daily Metrics
Updated every 6 hours

### Notifications
Sent via FCM for:
- Payment confirmations
- Escrow releases
- Test results
- Dispute updates
