# Study Assistance Backend - Setup Guide

## Prerequisites

- Bun runtime installed
- PostgreSQL database
- Firebase project with Admin SDK

## Installation

1. **Clone and install dependencies**
```bash
git clone <repository>
cd note-llm-backend
bun install
```

2. **Set up environment variables**

Copy `.env.example` to `.env` and fill in your values:

```bash
cp .env.example .env
```

Required environment variables:
- `DATABASE_URL` - PostgreSQL connection string
- `FIREBASE_PROJECT_ID` - Firebase project ID
- `FIREBASE_PRIVATE_KEY` - Firebase private key
- `FIREBASE_CLIENT_EMAIL` - Firebase client email
- `JWT_SECRET` - Secret key for JWT tokens
- `OPENAI_API_KEY` - OpenAI API key (optional)
- `STORAGE_BUCKET` - Firebase storage bucket

3. **Set up database**

```bash
# Generate Prisma client
bun run db:generate

# Push schema to database
bun run db:push

# Or run migrations
bun run db:migrate

# Seed initial data
bun run db:seed
```

4. **Start development server**

```bash
bun run dev
```

Server will start on http://localhost:3000

## Firebase Setup

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Create or select your project
3. Go to Project Settings > Service Accounts
4. Generate new private key
5. Copy the credentials to your `.env` file

### Enable Firebase Services

- **Authentication**: Enable Email/Password provider
- **Storage**: Set up storage bucket for file uploads
- **Cloud Messaging**: Enable for push notifications

## Database Schema

The application uses PostgreSQL with Prisma ORM. The schema includes:

- Users & User Profiles
- Plans & Purchases
- Notes & Note Orders (Marketplace)
- Mock Tests & Questions
- Test Attempts
- AI Requests & Outputs (with caching)
- Notifications & Device Tokens
- Daily Metrics & Analytics

## Scripts

- `bun run dev` - Start development server with hot reload
- `bun run start` - Start production server
- `bun run db:generate` - Generate Prisma client
- `bun run db:push` - Push schema to database
- `bun run db:migrate` - Run database migrations
- `bun run db:studio` - Open Prisma Studio
- `bun run db:seed` - Seed initial data

## Project Structure

```
src/
├── config/           # Configuration files
├── controllers/      # Request handlers
├── middleware/       # Express middleware
├── routes/          # API routes
├── services/        # Business logic & cron jobs
├── scripts/         # Database seeds & utilities
├── generated/       # Generated Prisma client
└── index.ts         # Main application entry

prisma/
├── schema.prisma    # Database schema
└── prisma.config.ts # Prisma configuration
```

## Testing the API

### Using cURL

```bash
# Health check
curl http://localhost:3000/health

# Get plans
curl http://localhost:3000/api/plans
```

### Using Postman/Insomnia

Import the API endpoints from `API_DOCS.md`

## Production Deployment

1. Set `NODE_ENV=production` in environment
2. Use a managed PostgreSQL instance
3. Set up proper Firebase service account
4. Configure proper CORS origins
5. Use a process manager (PM2, systemd)
6. Set up SSL/TLS certificates
7. Configure rate limiting
8. Set up logging and monitoring

## Troubleshooting

### Prisma Client Generation Fails
```bash
bun --bun prisma generate
```

### Database Connection Issues
- Check `DATABASE_URL` format
- Ensure PostgreSQL is running
- Verify firewall settings

### Firebase Auth Issues
- Verify service account credentials
- Check Firebase project configuration
- Ensure proper environment variable escaping

## Support

For issues or questions, refer to:
- [Prisma Documentation](https://www.prisma.io/docs)
- [Firebase Documentation](https://firebase.google.com/docs)
- [Express Documentation](https://expressjs.com/)
