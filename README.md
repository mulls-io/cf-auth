# Cloudflare Auth Starter

A plug-and-play authentication system built specifically for Cloudflare Pages and Workers, using a monorepo structure. This project provides everything you need to add authentication to your Cloudflare-hosted application.

## Features

### Worker Setup

- Pre-configured `wrangler.toml` for easy deployment
- D1 database integration for auth data storage
- Type-safe Cloudflare Workers implementation
- Kysely query builder for type-safe database operations

### Authentication System

- Complete auth flow implementation:
  - User signup
  - Login/Logout
  - Session management
  - Protected routes (`/dashboard`, `/admin`)
  - Secure cookie handling

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
├── worker/                 # Cloudflare Worker
│   ├── worker.ts          # Main worker entry
│   ├── auth.ts            # Auth utilities
│   ├── types.ts           # TypeScript types
│   ├── migrations/        # SQL migrations
│   └── wrangler.toml      # Worker configuration
│
└── src/                   # Frontend React app
    ├── components/        # React components
    ├── lib/              # Shared utilities
    └── main.tsx          # App entry point
```

## Getting Started

### Prerequisites

- Node.js 16+
- Wrangler CLI (`npm install -g wrangler`)
- Cloudflare account

### Setup

1. Clone the repository:

```bash
git clone <repository-url>
cd <repository-name>
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
ALLOWED_ORIGINS=http://localhost:5173,https://your-production-domain.com
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
- `ALLOWED_ORIGINS`: Comma-separated list of allowed CORS origins
- `SITE_URL`: Your frontend application URL
- `ASSETS_URL`: URL where your static assets are served from
- `DB`: D1 database binding (configured in wrangler.toml)

### Frontend

- `VITE_API_URL`: Your worker's API URL (e.g., `https://auth-api.your-domain.workers.dev`)

## API Routes

### Authentication Endpoints

- `POST /api/auth/signup`: Create new user account
- `POST /api/auth/login`: Authenticate user
- `POST /api/auth/logout`: End user session
- `
