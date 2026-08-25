# Backend Architecture & Implementation Plan — Sky Cadastral

This document defines the complete technical implementation plan for building the backend services, database schema, API layer, file ingestion pipeline, and security framework for the **Sky Cadastral 3D Land Plot Booking System**.

---

## User Review Required

> [!IMPORTANT]
> **Database & Infrastructure Stack Selection**
> We recommend a **Node.js (Express + TypeScript) REST API** coupled with **PostgreSQL** (managed via Supabase or Prisma ORM) and **Cloud Storage** (S3 / Supabase Storage). 
> This provides native support for spatial JSON polygon coordinates, ACID atomic transaction locks for plot reservations, and seamless real-time plot availability updates.

> [!NOTE]
> **No Frontend Source Code Changes**
> Per user directive ("make a backend plan only"), this plan strictly outlines the backend architecture and server-side components. No frontend code or implementation will be executed until approved.

---

## Proposed System Architecture

```
[ Customer 3D Explorer ]     [ Admin Control Panel ]
         │                            │
         └─────────────┬──────────────┘
                       │ HTTPS / WSS
                       ▼
          ┌─────────────────────────┐
          │  API Gateway / Router   │
          │  (Node.js / Express TS) │
          └────────────┬────────────┘
                       │
     ┌─────────────────┼─────────────────┬────────────────┐
     ▼                 ▼                 ▼                ▼
┌──────────┐     ┌──────────┐     ┌─────────────┐  ┌─────────────┐
│   Auth   │     │  Layout  │     │    Plot     │  │   Booking   │
│ Service  │     │ Service  │     │ Management  │  │ & Lock Svc  │
└────┬─────┘     └────┬─────┘     └──────┬──────┘  └──────┬──────┘
     │                │                  │                │
     ▼                ▼                  ▼                ▼
 ┌───────┐      ┌───────────┐      ┌───────────┐    ┌───────────┐
 │ JWT / │      │ Storage   │      │PostgreSQL │    │ ACID Row  │
 │ RBAC  │      │ (S3/Files)│      │  JSONB    │    │ Lock Tx   │
 └───────┘      └───────────┘      └───────────┘    └───────────┘
```

---

## Proposed Components & Files

### [NEW] Backend Infrastructure Modules

#### [NEW] [server/package.json](file:///c:/Users/SHRI/Desktop/Sky_Cadastral-main/server/package.json)
- Express, TypeScript, Prisma/Supabase, Multer, JWT, bcrypt, Cors, Zod validation.

#### [NEW] [server/prisma/schema.prisma](file:///c:/Users/SHRI/Desktop/Sky_Cadastral-main/server/prisma/schema.prisma)
- PostgreSQL relational data model with spatial JSONB polygon coordinate definitions.

#### [NEW] [server/src/controllers/authController.ts](file:///c:/Users/SHRI/Desktop/Sky_Cadastral-main/server/src/controllers/authController.ts)
- Admin authentication, password hashing, and JWT token issuance.

#### [NEW] [server/src/controllers/layoutController.ts](file:///c:/Users/SHRI/Desktop/Sky_Cadastral-main/server/src/controllers/layoutController.ts)
- PDF / Image layout file upload, metadata storage, and layout publishing.

#### [NEW] [server/src/controllers/plotController.ts](file:///c:/Users/SHRI/Desktop/Sky_Cadastral-main/server/src/controllers/plotController.ts)
- Plot CRUD, bulk polygon vector storage, metadata assignment, and public plot queries.

#### [NEW] [server/src/controllers/bookingController.ts](file:///c:/Users/SHRI/Desktop/Sky_Cadastral-main/server/src/controllers/bookingController.ts)
- Atomic reservation transaction lock, booking reference generation (`SKY-2026-XXXXX`), and status transition (`available` -> `booked`).

---

## Database Schema (PostgreSQL Data Model)

### 1. `users` Table
| Column | Type | Constraints | Description |
|---|---|---|---|
| `id` | UUID | PRIMARY KEY | Unique user ID |
| `email` | VARCHAR(255) | UNIQUE, NOT NULL | Admin / Agent email |
| `password_hash` | VARCHAR(255) | NOT NULL | Bcrypt hashed password |
| `role` | VARCHAR(50) | NOT NULL | `'admin'`, `'agent'`, `'customer'` |
| `full_name` | VARCHAR(100) | NOT NULL | User's full name |
| `phone` | VARCHAR(20) | NULL | Phone number |
| `created_at` | TIMESTAMP | DEFAULT NOW() | Timestamp |

### 2. `layouts` Table
| Column | Type | Constraints | Description |
|---|---|---|---|
| `id` | UUID | PRIMARY KEY | Layout ID |
| `name` | VARCHAR(255) | NOT NULL | Layout title (e.g. Master Plan Phase 1) |
| `location` | VARCHAR(255) | NOT NULL | Geographic location |
| `survey_number` | VARCHAR(100) | NOT NULL | Gat No. / Survey number |
| `approval_status` | VARCHAR(100) | NOT NULL | N.A. Approval status |
| `original_file_url`| TEXT | NOT NULL | Uploaded PDF/Image S3 URL |
| `rendered_image_url`| TEXT | NULL | Processed 300DPI Canvas URL |
| `scale_factor` | FLOAT | DEFAULT 1.0 | 2D to 3D coordinate scaling |
| `status` | VARCHAR(50) | DEFAULT 'draft' | `'draft'`, `'published'`, `'archived'` |
| `created_at` | TIMESTAMP | DEFAULT NOW() | Creation timestamp |

### 3. `plots` Table
| Column | Type | Constraints | Description |
|---|---|---|---|
| `id` | UUID | PRIMARY KEY | Plot ID |
| `layout_id` | UUID | FOREIGN KEY | References `layouts(id)` |
| `plot_number` | VARCHAR(50) | NOT NULL | Display plot number (e.g. P-102) |
| `sector` | VARCHAR(50) | NOT NULL | Sector / Zone |
| `area` | INT | NOT NULL | Area in sq.ft |
| `price` | BIGINT | NOT NULL | Price in INR (₹) |
| `facing` | VARCHAR(50) | NOT NULL | Facing direction |
| `type` | VARCHAR(50) | DEFAULT 'Regular' | `'Regular'`, `'Corner'`, `'Premium'`, `'Irregular'` |
| `status` | VARCHAR(50) | DEFAULT 'available'| `'available'`, `'pending'`, `'booked'`, `'sold'` |
| `dimensions` | VARCHAR(100) | NULL | Dimension string (e.g. 35' x 40') |
| `road_width` | VARCHAR(100) | NULL | Access road width |
| `coordinates` | JSONB | NOT NULL | 2D polygon array `[[x1,y1], [x2,y2]...]` |
| `version` | INT | DEFAULT 1 | Optimistic locking version |

### 4. `bookings` Table
| Column | Type | Constraints | Description |
|---|---|---|---|
| `id` | UUID | PRIMARY KEY | Booking ID |
| `plot_id` | UUID | FOREIGN KEY | References `plots(id)` |
| `reference_number`| VARCHAR(100) | UNIQUE, NOT NULL| Reference code (e.g. `SKY-2026-84920`) |
| `customer_name` | VARCHAR(100) | NOT NULL | Customer full name |
| `customer_phone` | VARCHAR(20) | NOT NULL | Contact phone number |
| `customer_email` | VARCHAR(255) | NULL | Customer email |
| `status` | VARCHAR(50) | DEFAULT 'pending'| `'pending'`, `'confirmed'`, `'cancelled'` |
| `created_at` | TIMESTAMP | DEFAULT NOW() | Timestamp |

---

## API Specification (RESTful Endpoints)

### Auth Endpoints
- `POST /api/v1/auth/login` -> Authenticates Admin & returns JWT bearer token.
- `GET /api/v1/auth/me` -> Validates session token.

### Layout Endpoints
- `GET /api/v1/layouts` -> List all master plan layouts.
- `GET /api/v1/layouts/:id` -> Fetch layout metadata and boundary settings.
- `POST /api/v1/layouts/upload` -> `[Admin Only]` Upload PDF/Image blueprint file via Multer.
- `PUT /api/v1/layouts/:id/publish` -> `[Admin Only]` Publish layout for public 3D viewing.

### Plot Endpoints
- `GET /api/v1/layouts/:layoutId/plots` -> Fetch all plots with polygon coordinates and current statuses.
- `GET /api/v1/plots/:id` -> Fetch detailed plot specifications.
- `POST /api/v1/layouts/:layoutId/plots/bulk` -> `[Admin Only]` Save detected / edited plot polygons & metadata.
- `PUT /api/v1/plots/:id` -> `[Admin Only]` Update single plot price, area, facing, or status.

### Booking Endpoints
- `POST /api/v1/plots/:id/book` -> Public endpoint to request a plot booking.
  - Enforces database row lock (`SELECT FOR UPDATE`).
  - Checks if plot status is `'available'`.
  - Updates status to `'booked'` atomically and creates booking record.
  - Emits real-time WebSocket update to all connected 3D explorers.
- `GET /api/v1/admin/bookings` -> `[Admin Only]` View all customer reservation requests.
- `PUT /api/v1/admin/bookings/:id/status` -> `[Admin Only]` Confirm or cancel a booking request.

---

## Concurrency & Race Condition Safety

To prevent double-booking of the exact same plot by multiple customers simultaneously:

```sql
-- Atomic Booking Transaction Procedure
BEGIN;

-- Lock plot row for update
SELECT id, status FROM plots 
WHERE id = 'target-plot-uuid' AND status = 'available' 
FOR UPDATE;

-- Update plot status
UPDATE plots 
SET status = 'booked', updated_at = NOW() 
WHERE id = 'target-plot-uuid';

-- Insert booking record
INSERT INTO bookings (id, plot_id, reference_number, customer_name, customer_phone, status) 
VALUES (gen_random_uuid(), 'target-plot-uuid', 'SKY-2026-84920', 'John Doe', '9876543210', 'confirmed');

COMMIT;
```

---

## Verification Plan

### Automated Tests
1. **API Integration Unit Tests**: `jest` or `vitest` testing authentication, layout uploading, and CRUD endpoints.
2. **Concurrency Race Condition Tests**: Parallel test script firing 10 simultaneous booking requests for a single plot to verify that exactly 1 request succeeds and 9 receive `409 Conflict ("Plot already booked")`.

### Manual Verification
1. Test PDF and image file upload validation via Postman / Insomnia.
2. Test JWT route protection on admin endpoints.
3. Test database seed scripts and Prisma migration rollbacks.
