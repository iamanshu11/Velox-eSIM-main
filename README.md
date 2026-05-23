# Velox eSIM

A full-stack eSIM management platform built with **Next.js 15** (frontend) and **Express + TypeScript + Prisma** (backend), backed by **PostgreSQL** and **Redis**.

---

## Table of Contents

- [Project Structure](#project-structure)
- [Quick Start with Docker](#quick-start-with-docker)
  - [Prerequisites](#prerequisites)
  - [1. Clone the repository](#1-clone-the-repository)
  - [2. Configure environment variables](#2-configure-environment-variables)
  - [3. Build and start all services](#3-build-and-start-all-services)
  - [4. Verify everything is running](#4-verify-everything-is-running)
- [Services Overview](#services-overview)
- [Environment Variables Reference](#environment-variables-reference)
- [Common Docker Commands](#common-docker-commands)
- [Local Development (without Docker)](#local-development-without-docker)
- [CRM API Integration](#crm-api-integration)
- [Troubleshooting](#troubleshooting)

---

## Project Structure

```
Velox-eSIM-main/
├── backend/                  # Express + TypeScript API (port 5000)
│   ├── src/
│   │   ├── modules/          # Feature modules (auth, admin, crm, webhook …)
│   │   ├── middleware/       # CORS, auth, CRM API key, logging
│   │   └── index.ts          # App entry point
│   ├── prisma/
│   │   └── schema.prisma     # Database schema
│   ├── Dockerfile            # Multi-stage Docker build
│   └── .npmrc                # legacy-peer-deps=true
├── frontend/                 # Next.js 15 UI (port 3000)
│   ├── src/
│   ├── Dockerfile            # Multi-stage Docker build
│   └── .npmrc                # legacy-peer-deps=true
├── docker-compose.yml        # Orchestrates all 4 services
├── .env.docker.example       # Template — copy to .env.docker and fill in
├── .env.docker               # Your secrets (NOT committed to git)
└── .gitignore
```

---

## Quick Start with Docker

### Prerequisites

| Tool | Minimum version | Check |
|------|----------------|-------|
| Docker Desktop (or Docker Engine) | 24+ | `docker --version` |
| Docker Compose (included with Docker Desktop) | 2.20+ | `docker compose version` |

> **macOS / Windows:** Install [Docker Desktop](https://www.docker.com/products/docker-desktop/).  
> **Linux:** Install [Docker Engine](https://docs.docker.com/engine/install/) + the Compose plugin.

---

### 1. Clone the repository

```bash
git clone <your-repo-url>
cd Velox-eSIM-main
```

---

### 2. Configure environment variables

Copy the example file and fill in your secrets:

```bash
cp .env.docker.example .env.docker
```

Open `.env.docker` and replace every `<CHANGE_ME>` with a real value. The **minimum required** values to get started are:

| Variable | How to generate / find it |
|----------|--------------------------|
| `JWT_SECRET` | `openssl rand -hex 64` |
| `CRM_API_KEY` | Any strong random string — must match `VELOX_API_KEY` in your CRM backend |
| `STRIPE_SECRET_KEY` | Stripe Dashboard → Developers → API keys |
| `STRIPE_PUBLIC_KEY` | Same page as above (publishable key) |
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | Same publishable key |
| `SEED_ADMIN_EMAIL` | Email for the first admin account |
| `SEED_ADMIN_PASSWORD` | Strong password for the first admin account |

> `DATABASE_URL` and `REDIS_URL` are **not** in `.env.docker` — they are set automatically by `docker-compose.yml` using Docker's internal service hostnames (`postgres` and `redis`).

---

### 3. Build and start all services

```bash
docker compose up --build
```

This single command will:

1. Pull the `postgres:15-alpine` and `redis:7-alpine` images
2. Build the backend image (TypeScript compile + Prisma generate)
3. Build the frontend image (Next.js production build)
4. Start all 4 services in the correct order (postgres → redis → backend → frontend)
5. Run `prisma db push` on first startup to create all database tables

The first build takes **3–6 minutes** because it compiles TypeScript and runs `next build`. Subsequent builds are much faster thanks to Docker layer caching.

To run in the background (detached mode):

```bash
docker compose up --build -d
```

---

### 4. Verify everything is running

Once you see `frontend` logs showing `ready`, open:

| Service | URL |
|---------|-----|
| Frontend (Next.js) | http://localhost:3000 |
| Backend API | http://localhost:5000 |
| Backend health check | http://localhost:5000/health |
| PostgreSQL | localhost:5432 (user: `velox`, db: `velox_esim`) |
| Redis | localhost:6379 |

Check all containers are healthy:

```bash
docker compose ps
```

All four services should show `healthy` or `running` status.

Test the backend health endpoint:

```bash
curl http://localhost:5000/health
# Expected: {"status":"ok","timestamp":"...","uptime":...}
```

---

## Services Overview

| Service | Image / Build | Port | Purpose |
|---------|--------------|------|---------|
| `postgres` | `postgres:15-alpine` | 5432 | Primary database |
| `redis` | `redis:7-alpine` | 6379 | Session cache + rate limiting |
| `backend` | Built from `./backend/Dockerfile` | 5000 | REST API (Express + Prisma) |
| `frontend` | Built from `./frontend/Dockerfile` | 3000 | Next.js 15 web app |

**Startup order:** `postgres` and `redis` must pass their healthchecks before `backend` starts. `backend` must pass its healthcheck before `frontend` starts.

**Database persistence:** PostgreSQL data is stored in a named Docker volume (`postgres_data`). Your data survives `docker compose down`. To wipe the database, use `docker compose down -v`.

---

## Environment Variables Reference

### Variables set automatically by docker-compose (do not add to `.env.docker`)

| Variable | Value in Docker | Description |
|----------|----------------|-------------|
| `DATABASE_URL` | `postgresql://velox:velox_pass@postgres:5432/velox_esim` | Uses Docker service hostname `postgres` |
| `REDIS_URL` | `redis://redis:6379` | Uses Docker service hostname `redis` |
| `NODE_ENV` | `production` | Set to production inside containers |

### Variables you must configure in `.env.docker`

| Variable | Required | Description |
|----------|----------|-------------|
| `JWT_SECRET` | **Yes** | Signs JWT tokens. Use `openssl rand -hex 64` |
| `JWT_EXPIRES_IN` | No (default: `7d`) | Token expiry, e.g. `1d`, `7d`, `30d` |
| `CRM_API_KEY` | **Yes** | Shared secret for CRM server-to-server calls |
| `STRIPE_SECRET_KEY` | For payments | Stripe secret key (`sk_test_…` or `sk_live_…`) |
| `STRIPE_PUBLIC_KEY` | For payments | Stripe publishable key |
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | For payments | Same publishable key (used by frontend) |
| `STRIPE_WEBHOOK_SECRET` | For webhooks | `whsec_…` from Stripe Dashboard |
| `CLOUDINARY_CLOUD_NAME` | For image uploads | Cloudinary cloud name |
| `CLOUDINARY_API_KEY` | For image uploads | Cloudinary API key |
| `CLOUDINARY_API_SECRET` | For image uploads | Cloudinary API secret |
| `SENDGRID_API_KEY` | For email | SendGrid API key (`SG.…`) |
| `AI_API_KEY` | For chat feature | OpenAI (or compatible) API key |
| `SEED_ADMIN_EMAIL` | **Yes** | Email for the seeded admin account |
| `SEED_ADMIN_PASSWORD` | **Yes** | Password for the seeded admin account |

---

## Common Docker Commands

```bash
# Start everything (build images first)
docker compose up --build

# Start in background
docker compose up --build -d

# View logs for all services
docker compose logs -f

# View logs for a specific service
docker compose logs -f backend
docker compose logs -f frontend

# Stop all services (data is preserved)
docker compose down

# Stop and DELETE the database volume (wipes all data)
docker compose down -v

# Rebuild a single service without restarting others
docker compose build backend
docker compose up -d --no-deps backend

# Open a shell inside the running backend container
docker compose exec backend sh

# Run a Prisma migration manually
docker compose exec backend npx prisma db push

# Open Prisma Studio (database GUI) locally
# (run this on your host machine, not in Docker)
cd backend && npx prisma studio
```

---

## Local Development (without Docker)

If you prefer to run the services locally without Docker:

### Prerequisites

- Node.js >= 20.12.0 and npm >= 10.0.0
- PostgreSQL 15 running locally
- Redis 7 running locally

### Backend

```bash
cd backend
cp .env.example .env        # or create .env manually
# Edit .env — set DATABASE_URL and REDIS_URL to your local services
npm install
npx prisma db push
npm run dev
```

The backend starts on http://localhost:5000.

### Frontend

```bash
cd frontend
cp .env.example .env.local  # or create .env.local manually
# Set NEXT_PUBLIC_API_URL=http://localhost:5000
npm install
npm run dev
```

The frontend starts on http://localhost:3000.

---

## CRM API Integration

The backend exposes a set of protected endpoints that your CRM system can call. These are authenticated via a shared API key (no user login required).

### Authentication

All CRM endpoints require an `x-api-key` header:

```
x-api-key: <your CRM_API_KEY from .env.docker>
```

### Base URL

```
http://localhost:5000/api/admin/crm
```

### Available Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/admin/crm/customers` | List all customers with eSIM orders |
| `GET` | `/api/admin/crm/customers/:id` | Get a single customer by ID |
| `GET` | `/api/admin/crm/orders` | List all orders |
| `GET` | `/api/admin/crm/orders/:id` | Get a single order by ID |
| `GET` | `/api/admin/crm/stats` | Dashboard summary statistics |

### Example Request

```bash
curl -H "x-api-key: your_crm_api_key_here" \
     http://localhost:5000/api/admin/crm/customers
```

See `VELOX_CRM_API.md` for full request/response documentation.

---

## Troubleshooting

### `npm ci` fails during Docker build

The frontend and backend both use `legacy-peer-deps=true` (configured in their `.npmrc` files). If you see a peer dependency error, make sure `.npmrc` exists in both `backend/` and `frontend/` directories.

### `prisma db push` fails at startup

This usually means the backend container started before PostgreSQL was fully ready. The `depends_on: condition: service_healthy` in `docker-compose.yml` should prevent this, but if it happens:

```bash
docker compose restart backend
```

### Port already in use

If port 5432, 6379, 3000, or 5000 is already in use on your machine, either stop the conflicting service or change the host-side port mapping in `docker-compose.yml`:

```yaml
ports:
  - "5433:5432"   # maps host port 5433 → container port 5432
```

### Frontend shows blank page or API errors

Check that `NEXT_PUBLIC_API_URL` in `docker-compose.yml` (under the `frontend` build args) is accessible from the browser. In a standard local setup it should be `http://localhost:5000`.

### View container health status

```bash
docker compose ps
# or for detailed health info:
docker inspect velox-esim-main-backend-1 | grep -A 10 '"Health"'
```

### Completely reset everything

```bash
docker compose down -v          # stop containers + delete volumes
docker system prune -f          # remove unused images and build cache
docker compose up --build       # fresh start
```
