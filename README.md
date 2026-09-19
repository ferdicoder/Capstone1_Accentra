# Accentra

Accentra is a web-based practice management system for accounting firms in the Philippines. It centralizes client service requests, engagement tracking, workflow tasks, document exchange, firm users, and service templates in one application.

This repository contains the React frontend and the Node.js/Express backend used by the application. Supabase provides authentication and the application database, while Backblaze B2 stores uploaded documents.

## Current Features

### Client workspace

- Client account registration and sign-in.
- Client dashboard and profile management.
- View and create service requests.
- View engagements belonging to the client's business.
- Open an engagement detail page with service, client, assigned staff, dates, fee, status, tasks, activity, and documents.
- Upload documents to engagement tasks.
- Track task progress, required documents, remarks, deadlines, approvals, and requested revisions.

### Firm workspace

- Separate firm sign-in flow.
- Admin dashboard and staff dashboard.
- Admin user management, including staff creation and user status updates.
- Firm profile management.
- Service management with pricing, categories, descriptions, estimated time, recurring status, status, and template tasks.
- Service request management and request filtering.
- Convert a service request into an engagement with assigned staff, dates, and fee.
- Engagement list and engagement detail views.
- Add and edit engagement tasks, deadlines, required flags, and reference-document flags.
- Mark checklist tasks complete, review uploaded documents, approve tasks, or request revisions with remarks.
- Engagement activity logging for task additions, completions, approvals, and revision requests.
- Upload reference documents to service template tasks.
- Upload, download, and delete engagement documents.

### Document handling

- Uploads are held in memory by Multer and sent to Backblaze B2.
- Document metadata is stored in Supabase tables.
- Engagement document uploads use a compensating cleanup step if the database insert fails.
- Maximum upload size is 15 MB per file.
- Accepted MIME types are PDF, JPEG, PNG, WebP, Microsoft Word, and DOCX.

## Roles

The frontend currently exposes these application areas:

| Role | Application areas |
| --- | --- |
| Client | Dashboard, profile, service requests, engagements, engagement documents and task progress |
| Admin | Dashboard, users, profile, services, service requests, engagements |
| Firm staff | Dashboard, service requests, services, engagements |
| Billing officer | Billing, engagements,  |


## Application Routes

### Frontend routes

| Route | Purpose |
| --- | --- |
| `/client/signup` | Client registration |
| `/client/signin` | Client sign-in |
| `/firm/signin` | Firm sign-in |
| `/client/dashboard` | Client dashboard |
| `/client/profile` | Client profile |
| `/client/service-requests` | Client service requests |
| `/client/engagements` | Client engagements |
| `/client/engagements/:id` | Client engagement details |
| `/admin/dashboard` | Admin dashboard |
| `/admin/users` | User management |
| `/admin/profile` | Firm profile |
| `/admin/services` | Service management |
| `/admin/service-requests` | Firm service requests |
| `/admin/engagements` | Firm engagements |
| `/admin/engagements/:id` | Firm engagement details |
| `/firm/dashboard` | Staff dashboard |
| `/firm/service-requests` | Staff service requests |
| `/firm/services` | Staff service management |
| `/firm/engagements` | Staff engagements |
| `/firm/engagements/:id` | Staff engagement details |

### Backend API routes

The Express server mounts its API under `/api/v1`.

| Method | Endpoint | Purpose |
| --- | --- | --- |
| `POST` | `/api/v1/staffs/create` | Create a confirmed staff account through Supabase Admin Auth |
| `POST` | `/api/v1/services/create` | Create a service and its template tasks |
| `POST` | `/api/v1/documents/template/:templateTaskId` | Upload a service-template document |
| `POST` | `/api/v1/documents/engagement-task/:engagementTaskId` | Upload an engagement-task document |
| `GET` | `/api/v1/documents/:docId/download` | Download an engagement document |
| `DELETE` | `/api/v1/documents/:docId` | Delete an engagement document and its B2 object |

Most application data operations currently use the Supabase client directly from frontend API modules. The Express routes mainly handle privileged staff/service operations and file transfer operations.

### Supabase data routes

These are not Express HTTP routes. They are the Supabase Auth, table, and RPC operations called directly by the frontend or backend. Their availability depends on the corresponding Supabase schema, relationships, functions, and Row Level Security policies.

#### Supabase Auth

| Operation | Used for |
| --- | --- |
| `auth.signUp()` | Register a client and save profile/business fields in Supabase user metadata |
| `auth.signInWithPassword()` | Sign in clients and firm users |
| `auth.getSession()` | Restore the current browser session on application startup |
| `auth.onAuthStateChange()` | React to sign-in, sign-out, and session changes |
| `auth.getUser()` | Get the authenticated user for activity logging and backend token validation |
| `auth.exchangeCodeForSession()` | Exchange a PKCE callback URL for a Supabase session |
| `auth.admin.createUser()` | Backend-only creation of confirmed staff accounts with role and profile metadata |

#### Tables and operations

| Table | Operations used | Purpose |
| --- | --- | --- |
| `users` | `select`, `update` | User lists, profiles, contact details, and account status |
| `user_roles` | `select` | Resolve the signed-in user's application role and display roles with users |
| `roles` | `select` | Load available role options for staff management |
| `businesses` | `select` | Load the client's business and its owner details |
| `services` | `select` | List and display available services and service details |
| `service_requests` | `select`, `insert`, `update` | Create, list, filter, review, and update service requests |
| `engagements` | `select`, `update` | List engagements, load details, and update engagement status |
| `engagement_tasks` | `select`, `insert`, `update` | Manage task definitions, deadlines, completion, review status, remarks, and reviewers |
| `engagement_activity` | `select`, `insert` | Record and display engagement activity updates |
| `engagement_documents` | `select`, `insert`, `delete` | Store document metadata and list or remove engagement documents |
| `template_documents` | `insert` | Store metadata for service-template document uploads |

The frontend also uses relational selects between `businesses` and `users`, `engagements` and `services`, `engagements` and `businesses`, `engagements` and assigned staff, `engagements` and `engagement_tasks`, and `engagement_documents` and `engagement_tasks` or uploaders.

#### Supabase RPC functions

| Function | Used for |
| --- | --- |
| `create_service_with_template_tasks` | Atomically create a service together with its template tasks |
| `create_engagement` | Create an engagement from an approved service request |
| `update_service_with_template_tasks` | Update a service and its template tasks |

The backend additionally uses the Supabase Admin client to insert and query `template_documents` and `engagement_documents`, and to roll back document metadata when a Backblaze B2 operation fails. Document file contents are stored in Backblaze B2, not in Supabase Storage.

## Architecture

```text
React + Vite frontend
	|
	| Supabase client: auth and application data
	| Express API: privileged operations and file transfer
	v
Supabase Auth / PostgreSQL       Backblaze B2 object storage
```

### Frontend

- React 19 with Vite.
- React Router for client, admin, and staff route trees.
- Supabase JS with PKCE authentication.
- TanStack React Query for server-state data fetching and cache management.
- Zustand for the authentication store.
- Tailwind CSS and the local UI component collection.
- `lucide-react` for interface icons.

### Backend

- Node.js with ES modules.
- Express 5.
- Supabase JS for privileged database and authentication operations.
- Multer for multipart uploads.
- Axios for Backblaze B2 requests.
- CORS and JSON request handling.

## Repository Structure

```text
accentra/
├── backend/
│   ├── config/          Supabase, B2, and upload configuration
│   ├── controllers/     HTTP request handlers
│   ├── middlewares/     Authentication and rate-limit middleware
│   ├── routes/          Express route definitions
│   ├── services/        Backblaze B2 upload, download, and delete helpers
│   ├── test/            Backend test files
│   └── server.js        Express application entry point
├── frontend/
│   ├── src/components/  Shared, client, firm, and UI components
│   ├── src/hooks/       Authentication and data hooks
│   ├── src/layout/      Client, admin, and staff layouts
│   ├── src/pages/       Route-level pages
│   ├── src/services/    Authentication and API modules
│   └── src/routes/      React Router configuration
├── package.json         Root development commands
└── README.md
```

## Requirements

- Node.js and npm.
- A Supabase project with the application database schema, functions, and tables expected by the source code.
- A Backblaze B2 bucket for document storage.
- Supabase credentials for both browser and server use.

The repository does not include the Supabase schema or database migrations. Those must be provisioned separately before the application can use services, businesses, users, engagements, tasks, activity records, and document tables.

## Installation

Install dependencies in the root, backend, and frontend packages:

```bash
npm install
npm install --prefix backend
npm install --prefix frontend
```

Create `backend/.env` and `frontend/.env`. The local environment files are intentionally not documented with values here; never commit credentials or secret keys.

### Backend environment variables

```dotenv
PORT=3000
SUPABASE_URL=
SUPABASE_PUBLISHABLE_KEY=
SUPABASE_SECRET_KEY=
SUPABASE_JWKS_URL=
B2_KEY_ID=
B2_APPLICATION_KEY=
B2_BUCKET_ID=
B2_BUCKET_NAME=
```

`SUPABASE_SECRET_KEY`, `B2_APPLICATION_KEY`, and the other B2 credentials are server secrets and must only be used by the backend.

### Frontend environment variables

```dotenv
VITE_SUPABASE_URL=
VITE_SUPABASE_PUBLISHABLE_KEY=
VITE_API_BASE_URL=http://localhost:3000/api/v1
```

## Running Locally

From the repository root, start both development servers:

```bash
npm run dev
```

The root command runs the backend in watch mode and the frontend through Vite. The frontend development URL is normally printed by Vite, commonly `http://localhost:5173`. The backend listens on `PORT`, defaulting to `http://localhost:3000`.

To run either part separately:

```bash
npm run dev --prefix backend
npm run dev --prefix frontend
```

The frontend also supports:

```bash
npm run build --prefix frontend
npm run lint --prefix frontend
npm run preview --prefix frontend
```
