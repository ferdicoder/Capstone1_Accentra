# Accentra

<img width="1900" height="850" alt="Accentra application screenshot" src="https://github.com/user-attachments/assets/22bea220-2e90-46bf-bf8d-d4f1883e9f2c" />

**Demo:** [accentra.up.railway.app](https://accentra.up.railway.app)

Accentra is a web-based practice-management system for accounting firms in the
Philippines. It brings client service requests, engagements, workflow tasks,
document exchange, billing, payments, firm users, and service templates into
one application.

The repository contains two independent npm packages:

- `frontend/` - React 19 and Vite browser application.
- `backend/` - Node.js and Express 5 API for privileged operations and file
  transfer.

Supabase provides authentication and the application database. Backblaze B2
stores uploaded files. The Supabase schema is maintained outside this
repository; the SQL files in [`backend/sql/`](backend/sql/) are reference
scripts for applying or repairing parts of the live database.

## Features

### Client portal

- Register and sign in with Supabase Auth.
- Manage the client profile and business details.
- Browse services and submit service requests.
- View engagements, assigned staff, dates, fees, status, tasks, activity, and
  documents.
- Upload documents to engagement tasks and respond to requested revisions.
- View billing records and submit payment details with proof documents.
- Download completed engagement deliverables.

### Firm portals

- Admin, staff, and billing-officer dashboards with role-based access.
- Admin user management, staff account creation, role changes, and account
  status management.
- Firm and staff profile management, including the firm logo.
- Service management with categories, pricing, descriptions, estimated time,
  recurring status, active status, and template tasks.
- Service-request review and conversion into engagements.
- Engagement management, assignment, task deadlines, required documents,
  approvals, revisions, remarks, and activity history.
- Client and business management.
- Billing records, payment-status verification, and payment-proof review.
- Admin reporting with CSV/PDF export and audit logging.
- Service-template reference documents and engagement task reference files.

### File handling

- Document bytes are accepted in Multer memory storage and uploaded to
  Backblaze B2, not Supabase Storage.
- Document metadata is stored in Supabase.
- Engagement uploads use compensating cleanup when metadata or object
  operations fail.
- General documents are limited to 15 MiB per file.
- Accepted document MIME types are PDF, JPEG, PNG, WebP, Microsoft Word, and
  DOCX.
- Firm logos accept PNG, JPEG, WebP, and SVG, with a 2 MiB limit.

## Roles

| Role | Portal | Main capabilities |
| --- | --- | --- |
| Client | `/client` | Service requests, engagements, task submissions, documents, billing, and payments |
| Admin | `/admin` | Firm administration, users, clients, services, engagements, billing, and reports |
| Staff | `/firm` | Assigned service and engagement work, clients, tasks, and documents |
| Billing officer | `/billing-officer` | Billing, payments, engagements, and clients |

Authentication is handled by Supabase PKCE. The frontend stores the current
role in its Zustand auth store, while the backend validates bearer tokens and
resolves roles from `user_roles`.

## Application routes

### Frontend routes

| Route | Access | Purpose |
| --- | --- | --- |
| `/` | Public | Landing page |
| `/client/signup` | Public | Client registration |
| `/client/signin` | Public | Client sign-in |
| `/firm/signin` | Public | Firm-user sign-in |
| `/set-password` | Inactive firm users | Set the password for a newly created account |
| `/client/dashboard` | Client | Client dashboard |
| `/client/profile` | Client | Client profile |
| `/client/service-requests` | Client | Client service requests |
| `/client/engagements` | Client | Client engagements |
| `/client/engagements/:id` | Client | Engagement details and task progress |
| `/client/billing` | Client | Client billing |
| `/client/billing/:id` | Client | Billing details and payment submission |
| `/admin/dashboard` | Admin | Admin dashboard |
| `/admin/users` | Admin | User management |
| `/admin/users/:id` | Admin | User details |
| `/admin/profile` | Admin | Firm profile |
| `/admin/services` | Admin | Service and template-task management |
| `/admin/service-requests` | Admin | Service-request management |
| `/admin/engagements` | Admin | Engagement management |
| `/admin/engagements/:id` | Admin | Engagement details |
| `/admin/clients` | Admin | Client management |
| `/admin/clients/:id` | Admin | Client details |
| `/admin/staff/:id` | Admin | Staff profile |
| `/admin/billing` | Admin | Billing management |
| `/admin/billing/:id` | Admin | Billing details and payment verification |
| `/admin/reports` | Admin | Reports and exports |
| `/firm/dashboard` | Staff | Staff dashboard |
| `/firm/profile` | Staff | Staff profile |
| `/firm/services` | Staff | View services and template tasks |
| `/firm/engagements` | Staff | Staff engagements |
| `/firm/engagements/:id` | Staff | Engagement details |
| `/firm/clients` | Staff | Client management |
| `/firm/clients/:id` | Staff | Client details |
| `/billing-officer/dashboard` | Billing officer | Billing dashboard |
| `/billing-officer/profile` | Billing officer | Billing-officer profile |
| `/billing-officer/engagements` | Billing officer | Engagement list |
| `/billing-officer/engagements/:id` | Billing officer | Engagement details |
| `/billing-officer/billing` | Billing officer | Billing management |
| `/billing-officer/billing/:id` | Billing officer | Billing details and payment verification |
| `/billing-officer/clients` | Billing officer | Client management |

The legacy `/firm-admin/*` and `/firm-staff/dashboard` paths redirect to their
current equivalents.

### Backend API

The Express server listens on `PORT` and mounts application routes under
`/api/v1`.

| Method | Endpoint | Purpose |
| --- | --- | --- |
| `GET` | `/health` | Deployment health check |
| `GET` | `/api/v1/staffs/me` | Get the authenticated user |
| `PATCH` | `/api/v1/staffs/password` | Change the authenticated user's password |
| `POST` | `/api/v1/staffs/create` | Admin-only staff account creation |
| `PATCH` | `/api/v1/staffs/:userId/role` | Admin-only role update |
| `GET` | `/api/v1/services/:serviceId/template-tasks` | Get service template tasks |
| `POST` | `/api/v1/services/create` | Create a service and template tasks |
| `DELETE` | `/api/v1/services/:id` | Delete or deactivate a service through the cleanup RPC |
| `POST` | `/api/v1/documents/template/:templateTaskId` | Upload a template-task reference file |
| `GET` | `/api/v1/documents/engagement/:engagementId/deliverables` | List engagement deliverables |
| `POST` | `/api/v1/documents/engagement/:engagementId/deliverables` | Upload an engagement deliverable |
| `GET` | `/api/v1/documents/deliverables/:deliverableId/download` | Download a deliverable |
| `DELETE` | `/api/v1/documents/deliverables/:deliverableId` | Delete a deliverable |
| `POST` | `/api/v1/documents/engagement/:engagementId/template-references` | Copy template references into an engagement |
| `POST` | `/api/v1/documents/engagement-task/:engagementTaskId/reference` | Upload a task reference file |
| `GET` | `/api/v1/documents/reference/:docId/download` | Download a task reference file |
| `DELETE` | `/api/v1/documents/reference/:docId` | Delete a task reference file |
| `POST` | `/api/v1/documents/engagement-task/:engagementTaskId` | Upload a client task submission |
| `GET` | `/api/v1/documents/:docId/download` | Download an engagement document |
| `DELETE` | `/api/v1/documents/:docId` | Delete an engagement document |
| `POST` | `/api/v1/payments/:billingId` | Submit a payment and optional proof document |
| `GET` | `/api/v1/payments/:paymentId/proof` | Download payment proof |
| `GET` | `/api/v1/firm-settings/logo` | Get the current firm logo |
| `POST` | `/api/v1/firm-settings/logo` | Admin-only firm-logo upload |
| `DELETE` | `/api/v1/firm-settings/logo` | Admin-only firm-logo deletion |

Most CRUD operations use the Supabase client directly from frontend API
modules. The Express API is intentionally limited to privileged account
operations, service RPCs, Backblaze B2 file operations, payments, and firm
settings.

## Architecture

```text
React + Vite frontend
        |
        | Supabase client: PKCE auth, PostgREST CRUD, and RPC calls
        | Express API: privileged operations and file transfer
        v
Supabase Auth / PostgreSQL       Backblaze B2 object storage
```

### Frontend

- React 19 with Vite.
- React Router route trees for client, admin, staff, and billing officer
  portals.
- TanStack React Query for server-state fetching and cache invalidation.
- Zustand for authentication and role state.
- Supabase JS for authentication and direct application-data access.
- Tailwind CSS v4 with the Base UI/shadcn-style component collection.
- Zod schemas for form validation.
- `lucide-react` for icons.

Frontend API modules map database rows from snake_case to the camelCase
shapes used by the UI. React Query keys are centralized in
[`frontend/src/config/queryKeys.js`](frontend/src/config/queryKeys.js).

### Backend

- Node.js ES modules and Express 5.
- Helmet, CORS, JSON parsing, bearer-token authentication, and role
  middleware.
- Supabase server client for privileged Auth and database operations.
- Multer memory storage for multipart uploads.
- Axios for Backblaze B2 authorization and object operations.
- IPv4 keep-alive B2 requests, cached B2 authorization, transient-network
  retries, and a configurable B2 request timeout.
- `trust proxy` is enabled for deployment behind Railway.

## Repository structure

```text
accentra/
├── backend/
│   ├── config/          Environment-backed Supabase, B2, CORS, and upload config
│   ├── controllers/     Express request handlers
│   ├── middlewares/     Authentication, roles, rate limits, and uploads
│   ├── routes/          API route definitions
│   ├── services/        Backblaze B2 helpers
│   ├── sql/             Reference SQL for functions, triggers, and RLS
│   └── server.js        Express entry point
├── frontend/
│   ├── src/components/  Shared, client, firm, and UI components
│   ├── src/hooks/       React Query and authentication hooks
│   ├── src/layout/      Portal layouts
│   ├── src/pages/       Route-level pages and reports
│   ├── src/services/    Supabase and backend API modules
│   ├── src/routes/      React Router configuration
│   └── tests/            Playwright end-to-end specs
├── supabase/
│   └── config.toml      Local Supabase CLI configuration
├── package.json          Root Supabase CLI dependency only
└── README.md
```

## Requirements

- Node.js and npm.
- A Supabase project with the tables, relationships, functions, Auth
  configuration, and RLS policies expected by the application.
- A Backblaze B2 bucket and application key for file storage.
- Browser-safe Supabase URL and publishable key.
- Server-side Supabase and B2 credentials.

There are no application migrations in this repository. The files under
[`backend/sql/`](backend/sql/) are reference copies and must be applied
manually through the Supabase SQL editor or the project's database workflow.
The live Supabase schema is the source of truth. In particular, review the
service, engagement, billing, service-request, user, and RLS reference files
before deploying a matching database change.

## Installation

The backend and frontend have separate dependency manifests. Install each
package independently:

```bash
npm install --prefix backend
npm install --prefix frontend
```

The root `package.json` only provides the Supabase CLI development dependency;
it does not define `dev`, `build`, or `test` scripts.

Create `backend/.env` and `frontend/.env`. These files are ignored and must
never contain values committed to Git.

### Backend environment

```dotenv
PORT=3000
SUPABASE_URL=
SUPABASE_PUBLISHABLE_KEY=
SUPABASE_SECRET_KEY=
FRONTEND_URL=http://localhost:5173
B2_KEY_ID=
B2_APPLICATION_KEY=
B2_BUCKET_ID=
B2_BUCKET_NAME=
B2_REQUEST_TIMEOUT_MS=60000
```

`FRONTEND_URL` is a comma-separated CORS allowlist. Requests without an
`Origin` header are allowed. `B2_REQUEST_TIMEOUT_MS` is optional and defaults
to 60,000 milliseconds. The Supabase secret key and all B2 credentials must
remain server-side.

### Frontend environment

```dotenv
VITE_SUPABASE_URL=
VITE_SUPABASE_PUBLISHABLE_KEY=
VITE_API_BASE_URL=http://localhost:3000/api/v1
```

`VITE_API_BASE_URL` is required. If it is configured without a scheme, the
frontend treats it as HTTPS.

## Running locally

Run the backend and frontend in separate terminals:

```bash
npm run dev --prefix backend
npm run dev --prefix frontend
```

The backend defaults to `http://localhost:3000`, and Vite normally serves the
frontend at `http://localhost:5173`.

Useful frontend commands:

```bash
npm run build --prefix frontend
npm run lint --prefix frontend
npm run preview --prefix frontend
npm run test --prefix frontend
```

`npm run test --prefix frontend` runs the Playwright suite and may start Vite
automatically. The checked-in end-to-end specs are scaffolding and require
valid test credentials and a configured application environment before they
can pass.

The backend test script is currently the npm placeholder and exits with an
error. The files under `backend/test/`, when present, are legacy scratch
scripts rather than a configured automated test suite.

## Database and security notes

- Supabase Auth uses PKCE in the browser.
- Backend protected routes validate bearer tokens with Supabase Auth and
  enforce application roles.
- Row Level Security policies are part of the external Supabase deployment;
  the reference SQL is not automatically applied by this repository.
- Service creation, service updates, engagement creation, and service cleanup
  depend on database functions such as
  `create_service_with_template_tasks`,
  `update_service_with_template_tasks`, `create_engagement`,
  `create_standalone_engagement`, and
  `delete_service_with_cleanup`.
- The service cleanup function deactivates services that are already referenced
  by an engagement or service request instead of deleting them outright.
- Uploaded file contents are kept in memory only while the request is
  processed and are stored in Backblaze B2.

Before submitting frontend changes, run the frontend lint command. When
changing data access or authorization, verify the corresponding live Supabase
tables, RPC signatures, relationships, and RLS policies as well as the
application code.
