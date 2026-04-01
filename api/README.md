# Auth Template API

NestJS authentication API template with email verification, JWT access tokens, refresh tokens, CSRF protection, password reset, and rate limiting.

## Features

- User registration with email verification
- Login with JWT access token
- Refresh token rotation/state tracking
- CSRF token cookie + header validation for protected refresh flow
- Password reset request + reset token flow
- Account lockout protection on repeated failed logins
- Swagger docs at `/api`

## Tech stack

- NestJS 11
- TypeORM + PostgreSQL
- JWT (`@nestjs/jwt`)
- Mailgun (`mailgun.js`)

## Run locally

```bash
npm install
cp .env .env.development
npm run start:dev
```

Default API URL: `http://localhost:4000`

## Environment variables

Core:

- `PORT`
- `API_VERSION`
- `API_TITLE`
- `API_DESCRIPTION`
- `ALLOWED_ORIGINS`

Auth:

- `JWT_SECRET`
- `JWT_REFRESH_SECRET`
- `JWT_ACCESS_TOKEN_EXPIRE_TIME`
- `JWT_REFRESH_TOKEN_EXPIRE_TIME`
- `COOKIE_EXPIRE_TIME`
- `CSRF_SECRET`

Database:

- `DATABASE_URL`
- `POSTGRES_HOST`
- `POSTGRES_PORT`
- `POSTGRES_DATABASE`
- `POSTGRES_USERNAME`
- `POSTGRES_PASSWORD`

Mail (verification + reset):

- `MAILGUN_API_KEY`
- `MAILGUN_DOMAIN`
- `MAILGUN_FROM_EMAIL`
- `MAILGUN_FROM_NAME`
- `MAILGUN_API_URL` (use `https://api.eu.mailgun.net` for EU domains)

## Main auth endpoints

- `POST /auth/register`
- `POST /auth/resend-verification-email`
- `POST /auth/verify-email/:token`
- `POST /auth/token`
- `POST /auth/logout`
- `POST /auth/refresh-token` (protected with CSRF guard)
- `POST /auth/password-reset/request`
- `POST /auth/password-reset/:token`

## Scripts

```bash
npm run start:dev
npm run build
npm run start:prod
npm run lint
npm run test
npm run test:cov
```

## Notes

- Do not commit real secrets in `.env` files.
- Keep local secrets in `.env.development`.
- Configure frontend base URL (`APP_URL`) so verification/reset links point to the correct client.
