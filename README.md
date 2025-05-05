# Cloudflare Auth Starter

A plug-and-play authentication system built specifically for Cloudflare Pages and Workers, using a monorepo structure. This project provides everything you need to add authentication to your Cloudflare-hosted application.

## Features

### Worker Setup

- Pre-configured `wrangler.toml` for easy deployment

- D1 database integration for auth data storage

- Type-safe Cloudflare Workers implementation

- Kysely query builder for type-safe database operations

- Resend email integration for auth flows

### Authentication System

- Complete auth flow implementation:

- User signup

- Login/Logout

- Session management

- Protected routes (`/dashboard`, `/admin`)

- Secure cookie handling

- Email verification

- Password reset functionality

### Security Features

- Secure password hashing using Web Crypto API

- HTTP-only secure cookies for session management

- CSRF protection via SameSite cookies

- Comprehensive error handling and logging

### Frontend

- React + TypeScript with Vite

- Modern UI components using shadcn/ui

- React Router for navigation

- TailwindCSS for styling

- Type-safe API integration

### Database

- Kysely query builder with D1 for type-safe operations

- Pre-defined user schema

- Migration system

## Project Structure

```
.

├── worker/ # Cloudflare Worker

│ ├── worker.ts # Main worker entry

│ ├── auth.ts # Auth utilities

│ ├── types.ts # TypeScript types

│ ├── migrations/ # SQL migrations

│ └── wrangler.toml # Worker configuration

│

└── src/ # Frontend React app

├── components/ # React components

├── lib/ # Shared utilities

└── main.tsx # App entry point
```

## Getting Started

### Prerequisites

- Node.js 16+

- Wrangler CLI (`npm install -g wrangler`)

- Cloudflare account

### Setup

1. Clone the repository:

```bash
git clone [<repository-url>](https://github.com/mulls-io/cf-auth.git)

cd cf-auth
```

2. Install dependencies:

```bash
# Install root dependencies

npm install



# Install worker dependencies

cd worker

npm install



# Return to root and install frontend dependencies

cd ..

npm install
```

3. Set up D1 database:

```bash
# Create a new D1 database

wrangler d1 create auth-db



# Copy the database_id from the output and paste it in worker/wrangler.toml



# Run the initial migration

cd worker

npm run setup-db
```

4. Configure your environment:

Create a `.dev.vars` file in the worker directory:

```env
AUTH_SECRET=your-secret-here

ALLOWED_ORIGINS=http://localhost:5173,https://my-app.pages.dev,https://my-domain.com

RESEND_API_KEY=your-resend-api-key

FROM_EMAIL=noreply@yourdomain.com (onboarding@resend.dev for development)
```

5. Start development:

```bash
# Start the worker

cd worker

npm run dev



# In a new terminal, start the frontend

cd ..

npm run dev
```

## Deployment

1. Deploy the worker:

```bash
cd worker

npm run deploy
```

2. Deploy the frontend to Cloudflare Pages:

```bash
npm run build

wrangler pages deploy dist
```

## Environment Variables

### Worker

- `AUTH_SECRET`: Secret key for token signing

  - Generate using `openssl rand -base64 32`

  - Deploy using `wrangler secret put AUTH_SECRET`

- `ALLOWED_ORIGINS`: Comma-separated list of allowed CORS origins

  - `http://localhost:5173,https://my-app.pages.dev,https://my-domain.com`

- `SITE_URL`: Your frontend application URL (used for redirects and URLs in emails)

  - Local: `http://localhost:5173`

  - Production: `https://my-app.pages.dev` or `https://my-domain.com`

- `ASSETS_URL`: URL where your static assets are served (used by the worker for proxying requests)

  - Local: `http://localhost:5173`

  - Production: Usually same as SITE_URL unless using a separate asset domain

- `DB`: D1 database binding (configured in wrangler.toml)

  - Create using `wrangler d1 create auth-db`

- `RESEND_API_KEY`: Your Resend API key for sending transactional emails

  - Obtain from [Resend dashboard](https://resend.com)

  - Deploy using `wrangler secret put RESEND_API_KEY`

  - `FROM_EMAIL`: Email address used as the sender for all emails

  - Must be a verified domain in your Resend account

### Frontend

- `VITE_API_URL`: Your worker's API URL (e.g., `https://auth-api.your-domain.workers.dev`)

## API Routes

### Authentication Endpoints

- `POST /api/auth/signup`: Create new user account

- `POST /api/auth/login`: Authenticate user

- `POST /api/auth/logout`: End user session

- `GET /api/auth/session`: Check current session status

- `POST /api/auth/verify-email`: Verify user's email address

- `POST /api/auth/reset-password`: Initiate password reset flow

- `POST /api/auth/reset-password-confirm`: Complete password reset with token

### Protected Routes

- `/dashboard/*`: Requires authentication

- `/admin/*`: Requires authentication

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

MIT
