# API Documentation

This document outlines the API routes available in the SalesIQ backend, mapped to the frontend pages that use them.

## Base URL
`http://localhost:5001/api`

---

## 1. FAQs Page (`/admin/faqs`)
Manage Frequently Asked Questions and their categories.

### Categories
#### Get All Categories
- **Endpoint:** `GET /faqs/categories`
- **Response:**
  ```json
  [
    {
      "_id": "60d5ec...",
      "name": "Billing",
      "description": "Payment related questions",
      "count": 5 // Number of FAQs in this category
    }
  ]
  ```

#### Create Category
- **Endpoint:** `POST /faqs/categories`
- **Body:**
  ```json
  {
    "name": "General",
    "description": "General questions"
  }
  ```
- **Response:** Created Category object.

#### Update Category
- **Endpoint:** `PUT /faqs/categories/:id`
- **Body:** `{ "name": "...", "description": "..." }`
- **Response:** Updated Category object.

#### Delete Category
- **Endpoint:** `DELETE /faqs/categories/:id`
- **Response:** `{ "message": "Category deleted" }`

### FAQs
#### Get FAQs
- **Endpoint:** `GET /faqs`
- **Query Params:** `?categoryId=...` (optional)
- **Response:**
  ```json
  [
    {
      "_id": "60d5ed...",
      "question": "How to reset password?",
      "answer": "Go to settings...",
      "categoryId": "60d5ec...",
      "status": "published",
      "updatedAt": "2026-01-31T10:00:00.000Z"
    }
  ]
  ```

#### Create FAQ
- **Endpoint:** `POST /faqs`
- **Body:**
  ```json
  {
    "question": "...",
    "answer": "...",
    "categoryId": "...",
    "status": "published" // or "draft"
  }
  ```
- **Response:** Created FAQ object.

#### Update FAQ
- **Endpoint:** `PUT /faqs/:id`
- **Body:** (Same as Create)
- **Response:** Updated FAQ object.

#### Delete FAQ
- **Endpoint:** `DELETE /faqs/:id`
- **Response:** `{ "message": "FAQ deleted" }`

---

## 2. Articles Page (`/admin/articles`)
Manage Knowledge Base articles.

### Categories
- **Endpoints:** Same pattern as FAQs (`GET /articles/categories`, `POST`, `PUT`, `DELETE`).

### Articles
#### Get Articles
- **Endpoint:** `GET /articles`
- **Query Params:** `?categoryId=...` (optional)
- **Response:**
  ```json
  [
    {
      "_id": "...",
      "title": "Getting Started",
      "content": "# Markdown Content",
      "categoryId": "...",
      "status": "published",
      "author": "System",
      "readTime": "5 min read",
      "publishDate": "..."
    }
  ]
  ```

#### Create/Update/Delete Article
- **Endpoints:** `POST /articles`, `PUT /articles/:id`, `DELETE /articles/:id`
- **Body (Create/Update):**
  ```json
  {
    "title": "...",
    "content": "...",
    "categoryId": "...",
    "status": "published"
  }
  ```

---

## 3. My Chats Page (`/admin/chats`)
View active conversations and visitor history.

#### Get All Chats
- **Endpoint:** `GET /chats`
- **Response:** List of chat sessions.
  ```json
  [
    {
      "_id": "...",
      "visitorId": { "name": "John Doe", ... },
      "status": "open",
      "updatedAt": "..."
    }
  ]
  ```

#### Get Chat History
- **Endpoint:** `GET /chats/history/:visitorId`
- **Response:**
  ```json
  [
    {
      "sender": "visitor", // or "agent", "system"
      "text": "Hello",
      "createdAt": "..."
    }
  ]
  ```

---

## 4. Visitors Page (`/admin/visitors/all`)
View all tracked visitors.

#### Get All Visitors
- **Endpoint:** `GET /visitors`
- **Response:**
  ```json
  [
    {
      "_id": "...",
      "ip": "127.0.0.1",
      "userAgent": "Mozilla/...",
      "status": "online",
      "lastSeen": "..."
    }
  ]
  ```

#### Get Visitor Details
- **Endpoint:** `GET /visitors/:id`
- **Response:** Single Visitor object.

#### Get Visitor Sessions
- **Endpoint:** `GET /visitors/:id/sessions`
- **Response:** List of sessions for that visitor (pages visited, duration).

---

## 5. Leads Page (`/admin/visitors/leads`)
View captured leads (visitors who provided contact info).

#### Get All Leads
- **Endpoint:** `GET /leads`
- **Response:**
  ```json
  [
    {
      "_id": "...",
      "name": "Jane Doe",
      "email": "jane@example.com",
      "phone": "123-456-7890",
      "chatId": "...",
      "createdAt": "..."
    }
  ]
  ```

---

## Socket.io Events
Real-time communication for chat and tracking.

### Namespace: `/`
#### Client (Visitor) Events
- `visitor:join`: Register visitor, start session.
- `visitor:heartbeat`: Keep session alive.
- `visitor-message`: Send a chat message.
- `lead:capture`: Submit contact form.

#### Agent (Admin) Events
- `agent-join`: Join company room to receive updates.
- `agent-message`: Send reply to visitor.

#### Server Emits
- `visitor-updated`: Visitor status/info changed.
- `new-message`: Incoming chat message.
- `session-created` / `session-updated`: Tracking updates.
