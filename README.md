# Auth Template

Auth Template is a starter repository for building a full-stack app with a production-oriented authentication flow.

## What this template includes

- `api/`: NestJS backend with:
  - registration
  - email verification
  - login with JWT access token
  - refresh token + CSRF protection
  - password reset flow
  - rate limiting and account lockout logic
- `app/`: Next.js frontend with:
  - register page
  - check-email page
  - verify-email page
  - login page

## Repository structure

```text
.
├── api/   # NestJS API
└── app/   # Next.js frontend
```

## Quick start

### 1) API

```bash
cd api
npm install
cp .env .env.development
npm run start:dev
```

API runs on `http://localhost:4000`.

### 2) Frontend

```bash
cd app
npm install
cp .env.example .env.local
npm run dev
```

Frontend runs on `http://localhost:3000`.

Set:

```bash
NEXT_PUBLIC_API_URL=http://localhost:4000
```

## Notes

- This repo is intentionally template-first: rename app/domain strings before starting a new product.
- Do not commit secrets. Keep local values in `.env.development` / `.env.local`.
