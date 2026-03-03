# TMS — Tenant Management System

Residential Multifamily Tenant Management Platform for the South African market. Lead-to-lease-to-lifecycle management with POPIA compliance, screening engine, and digital lease signing.

## Architecture

```
TMS (pnpm monorepo)
├── apps/
│   ├── api/          # NestJS backend (REST API)
│   ├── web/          # Next.js property manager dashboard
│   └── portal/       # Next.js tenant-facing portal
├── packages/
│   ├── database/     # Prisma schema & client
│   └── shared/       # Shared types, validation (Zod), constants
└── docker-compose.yml
```

## Tech Stack

- **Backend**: NestJS (Node.js), Prisma ORM, PostgreSQL
- **Frontend**: Next.js 14 (App Router), Tailwind CSS, Lucide Icons
- **Auth**: JWT + Refresh Tokens, RBAC (7 roles)
- **Storage**: Local filesystem (S3-compatible in production)
- **Infra**: Docker Compose (PostgreSQL, Redis, MinIO)

## Getting Started

### Prerequisites

- Node.js 20+
- pnpm 9+
- Docker & Docker Compose

### Setup

```bash
# 1. Clone and install dependencies
pnpm install

# 2. Start infrastructure (PostgreSQL, Redis, MinIO)
docker compose up -d

# 3. Copy environment file
cp .env.example .env

# 4. Generate Prisma client and push schema
pnpm db:generate
pnpm db:push

# 5. Seed demo data
pnpm db:seed

# 6. Start all services
pnpm dev
```

### Services

| Service | URL | Description |
|---------|-----|-------------|
| API | http://localhost:3001 | NestJS REST API |
| API Docs | http://localhost:3001/api/docs | Swagger/OpenAPI |
| Web Dashboard | http://localhost:3000 | Property Manager UI |
| Tenant Portal | http://localhost:3002 | Tenant Self-Service |

### Demo Credentials

All accounts use password: `Password123`

| Role | Email |
|------|-------|
| Portfolio Manager | admin@demo-properties.co.za |
| Leasing Agent | agent@demo-properties.co.za |
| Tenant | tenant@example.co.za |

## Core Modules (Phase 1 MVP)

### End-to-End Flow
1. **Property Management** — Create properties, units, portfolios
2. **Lead Capture** — Add leads via CRM, auto-scoring, pipeline tracking
3. **Application** — Multi-step digital application with POPIA consent
4. **Screening** — Mock screening engine (Identity, Credit, TPN, Criminal, Employment)
5. **Lease Generation** — Template-based lease with e-signature support
6. **Tenant Portal** — Self-service application, document upload, lease viewing

### API Endpoints

| Module | Endpoints |
|--------|-----------|
| Auth | POST `/auth/register`, `/auth/login`, `/auth/refresh`, GET `/auth/profile` |
| Properties | CRUD `/properties`, `/properties/portfolios`, `/properties/dashboard/stats` |
| Units | CRUD `/units` |
| Leads | CRUD `/leads`, PATCH `/leads/:id/status`, GET `/leads/pipeline` |
| Applications | CRUD `/applications`, PATCH `submit`, `review`, POST `consents`, `occupants`, `guarantors` |
| Screening | POST `/screening/applications/:id`, GET results |
| Leases | CRUD `/leases`, PATCH `sign`, `terminate`, templates |
| Documents | POST `/documents/upload`, GET/PATCH verify/reject |
| Tenants | CRUD `/tenants`, GET `/tenants/me` |

### User Roles (RBAC)

- **Super Admin** — Full platform access
- **Portfolio Manager** — All properties, financials, user management
- **Property Manager** — Assigned properties, tenants, leases
- **Leasing Agent** — Leads, applications, lease preparation
- **Finance User** — Invoicing, payments, financial reports
- **Tenant** — Self-service portal
- **Guarantor** — Limited portal access

## Data Model

```
Organisation
  └── Portfolio
        └── Property
              └── Unit
                    └── Lease ← Application ← Lead
                          └── Tenant
                                ├── Documents
                                ├── Screening Results
                                ├── Payments
                                └── Communications
```

## South African Compliance

- **POPIA**: Consent management with versioning and audit trail
- **Rental Housing Act**: Deposit handling, notice periods
- **ECT Act**: Digital lease signatures
- **NCA**: Affordability assessment (rent ≤ 33% gross income)
- **FICA/KYC**: Identity verification (DHA integration ready)

## Phase 2 Roadmap

- Full screening engine (TransUnion, TPN, DHA integrations)
- Configurable workflow engine (no-code)
- Automated billing and rent collection (DebiCheck, EFT)
- Arrears management automation
- Move-in/move-out workflows with condition reports
- Maintenance request system
- MRI Property Central integration
- White-label multi-tenant deployment
