Got it — you want a **proper, production-style README** for your Study Assistance App architecture covering:

* Postgres + Firebase hybrid setup
* DB schema approach
* AI storage
* marketplace escrow
* notifications
* infra + cost
* how services connect

You can paste this directly into your repo as `README.md`.

---

# 📚 Study Assistance App — Architecture & Backend README

## 📌 Overview

Study Assistance is a unified learning platform that provides notes, mock tests, AI-powered study tools, syllabus analysis, question generation, answer evaluation, marketplace for notes, and exam updates — all in one app.

This document describes the backend architecture, database design, service integration, and infrastructure decisions.

---

# 🧱 System Architecture

```
Frontend (Web + Mobile)
    ↓
Backend API (Node.js / Spring Boot)
    ↓                ↓
PostgreSQL        Firebase Services
(Main DB)         Auth + FCM + Storage
    ↓
AI APIs (LLM providers)
```

## Responsibilities

### PostgreSQL

* Core business data
* Users & profiles
* Plans & purchases
* Mock tests & results
* Marketplace orders
* AI logs & usage
* Analytics
* Notification logs

### Firebase

* Authentication
* Push notifications (FCM)
* File storage (PDFs, notes, media)
* Optional realtime features

---

# 🔐 Authentication Flow (Firebase + Postgres Sync)

1. User signs up / logs in via Firebase Auth
2. Frontend receives Firebase ID token
3. Token sent to backend API
4. Backend verifies token using Firebase Admin SDK
5. Backend fetches or creates user record in Postgres using `firebase_uid`
6. App session continues using Postgres user ID

---

# 🗄️ Database Design (PostgreSQL)

## Core Tables

### users

* id (uuid, pk)
* firebase_uid (unique)
* email
* name
* role (student/teacher/admin)
* plan_type
* created_at

---

### user_profiles

* user_id (fk)
* class_level
* interests (jsonb)
* exam_category
* daily_study_hours
* language

---

## Subscription & Payments

### plans

* id
* name
* price
* duration_days
* ai_limit_per_day
* mock_test_limit
* ads_enabled

### purchases

* id
* user_id
* plan_id
* amount
* payment_txn_id
* provider
* status
* start_date
* end_date

---

## Study Content

### notes

* id
* title
* subject
* exam_type
* description
* price
* seller_id
* file_url (Firebase Storage)
* approved
* created_at

---

## Mock Tests

### mock_tests

* id
* title
* subject
* exam_type
* total_marks
* duration_minutes

### questions

* id
* mock_test_id
* question_text
* options (jsonb)
* correct_answer
* topic
* difficulty

### test_attempts

* id
* user_id
* mock_test_id
* score
* time_taken
* weak_topics (jsonb)
* attempted_at

---

# 🛒 Marketplace Escrow Model

## Flow

1. Buyer purchases notes
2. Payment recorded
3. Order status = `HELD`
4. Buyer gets access
5. Escrow timer runs (ex: 48h)
6. If no dispute → release funds
7. Seller wallet credited
8. Platform commission deducted

## Tables

### note_orders

* id
* note_id
* buyer_id
* seller_id
* amount
* commission_amount
* escrow_status
* released_at

### seller_wallets

* seller_id
* balance

### transactions

* id
* seller_id
* order_id
* amount
* type

### disputes

* id
* order_id
* reason
* status
* resolved_by

---

# 🤖 AI Feature Storage Model

AI features include:

* syllabus scanning
* question generation
* answer evaluation
* summaries
* career guidance
* doubt solving

## Tables

### ai_requests

* id
* user_id
* feature_type
* model
* input_tokens
* output_tokens
* estimated_cost
* created_at

### ai_outputs

* id
* request_id
* prompt
* response
* cached
* prompt_hash

## Caching Strategy

Repeated prompts are hashed and reused to:

* reduce AI cost
* improve speed
* enforce plan limits

---

# 🔔 Notification Architecture

Push notifications use **Firebase Cloud Messaging (FCM)**.

## device_tokens

* id
* user_id
* fcm_token
* platform
* last_seen

## notifications

* id
* user_id
* title
* body
* type
* sent
* read
* sent_at

## Send Flow

```
cron job / event trigger
    ↓
backend selects users
    ↓
fetch FCM tokens
    ↓
send via Firebase Admin SDK
    ↓
log notification in Postgres
```

---

# 📁 File Storage

Use Firebase Storage (or S3/Supabase Storage) for:

* notes PDFs
* handwritten notes
* syllabus uploads
* mock attachments
* media files

Only file URLs are stored in Postgres.

---

# 🧠 Analytics & Admin Data

## daily_metrics

* date
* new_users
* active_users
* purchases
* revenue
* ai_calls

Used for:

* admin dashboard
* plan performance
* usage tracking

---

# 🔗 How PostgreSQL and Firebase Work Together

They are connected through the **backend**, not directly.

## Backend connects to:

* PostgreSQL → via DB driver / ORM
* Firebase → via Admin SDK

## Example Backend Logic

Verify Firebase token → map to Postgres user → continue business logic.

---

# ⚙️ Recommended Stack

## Backend

* Node.js (NestJS/Express) or Spring Boot
* Prisma / TypeORM / Hibernate

## Database

* PostgreSQL (primary)

## Firebase

* Auth
* FCM
* Storage

## Frontend

* Next.js (web + admin)
* Android Kotlin app

## AI

* LLM API provider
* usage logging + caching enabled

---

# 💰 MVP Infrastructure Cost Estimate

Assuming:

* 5k users
* 500 daily active
* moderate AI usage

## Monthly Estimate

DB (managed Postgres): $25–40
Backend server: $15–30
Storage: $5–15
Firebase Auth: free tier
FCM: free
CDN: $5
AI usage: $20–40

## Total

**~ $70–130/month**

---

# 🚀 MVP Build Order

1. Firebase Auth integration
2. Postgres schema setup
3. User + plan system
4. Notes + marketplace
5. Mock tests
6. AI features with logging
7. Notifications
8. Admin analytics
9. Escrow flow
10. Optimization + caching

---