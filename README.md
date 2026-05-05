# ManifeX API - Professional Starter Kit

A professional, well-structured, layered Node.js/TypeScript backend built with Express, Prisma, and Supabase. This starter kit follows a strict "Routes > Controllers > Services > Repositories" architecture.

## Key Features

- **Layered Architecture:** Strict separation of concerns (Routes, Controllers, Services, Repositories).
- **Prisma 7 Modular Schema:** Organized model definitions in the `prisma/schema/` directory.
- **Complete Authentication:** 
  - Email/Password Signup & Login
  - Social Login (Google, GitHub)
  - **Signup Email Verification** (with toggle)
  - **Forgot & Reset Password** via SMTP
  - Role-based Access (`user`, `admin`)
- **Email System:** Responsive HTML templates for all auth flows.
- **Supabase Integration:** Storage for avatars and PostgreSQL database.
- **CORS Support:** Dynamic handling for multiple allowed origins.
- **Standardized Responses:** Uniform JSON response format for all endpoints.

## Tech Stack

- **Runtime:** Node.js + TypeScript
- **Framework:** Express
- **ORM:** Prisma (v7+) with modular schema folder
- **Database:** PostgreSQL (via Supabase)
- **Auth:** JWT (jsonwebtoken) + bcryptjs
- **Email:** Nodemailer (SMTP)
- **Validation:** Zod
- **Logger:** Pino

## Project Structure

```text
├── docs/               # Architecture plans and Postman collection
├── prisma/
│   ├── schema/         # Modular Prisma model definitions
│   └── migrations/     # Database migrations
├── src/
│   ├── config/         # Zod-validated configuration
│   ├── controllers/    # Request handlers (wrapped in asyncHandler)
│   ├── services/       # Business logic orchestration
│   ├── repositories/   # Data access layer (Prisma)
│   ├── routes/         # Express route definitions
│   ├── middleware/     # Auth, error, and logging middleware
│   ├── lib/            # Shared library instances (Prisma, Supabase)
│   └── utils/          # Standardized response and error helpers
```

## Setup & Quickstart

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Environment Configuration:**
   Create a `.env` file based on `.env.example`. Ensure you provide SMTP and Database credentials.

3. **Database Setup:**
   ```bash
   npm run db:generate  # Generate Prisma client
   npm run db:migrate   # Run migrations (or use npm run db:push)
   ```

4. **Start Development:**
   ```bash
   npm run dev
   ```

## Key Commands

| Command | Description |
| :--- | :--- |
| `npm run dev` | Starts server in watch mode |
| `npm run build` | Compiles TypeScript to `dist/` |
| `npm run typecheck` | Validates TypeScript integrity |
| `npm run db:generate` | Generates the modular Prisma client |
| `npm run db:migrate` | Handles database migrations (Prisma Migrate) |
| `npm run db:push` | Syncs schema with DB without migrations |
| `npm run db:seed` | Populates DB with initial data (Admin user) |
| `npm run db:studio` | Opens Prisma Studio GUI |

## Authentication Endpoints

| Method | Endpoint | Auth Required | Purpose |
|--------|----------|---------------|---------|
| POST | `/api/auth/signup` | No | Register user |
| POST | `/api/auth/signin` | No | Login user |
| GET | `/api/auth/verify-email` | No | Verify email via token |
| POST | `/api/auth/resend-verification` | No | Resend verification email |
| POST | `/api/auth/forgot-password` | No | Request password reset |
| POST | `/api/auth/reset-password` | No | Reset password with token |
| POST | `/api/auth/social-login` | No | Social login auth |
| GET | `/api/auth/profile` | Yes | Get current profile |
| PATCH | `/api/auth/profile` | Yes | Update profile details |
| POST | `/api/auth/avatar` | Yes | Upload avatar image |
| POST | `/api/auth/change-password` | Yes | Change password while logged in |
| POST | `/api/auth/logout` | Yes | Logout (client-side) |

## API Response Format

All responses follow a consistent structure:

```json
{
  "status": boolean,
  "message": "String",
  "data": object | null,
  "error": object | null
}
```

## Documentation

- **Postman:** Import the collection and environment from `docs/postman/`.
- **Changelog:** Track all structural updates in `docs/changelog.md`.
- **Plans:** Architectural roadmaps are available in `docs/plans/`.
