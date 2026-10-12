# Leave Management System

A college project built with Django REST Framework (backend) and React + TypeScript (frontend).

## Features

- Three roles: Admin, Manager, Employee
- JWT-based authentication with token blacklisting on logout
- Expired access tokens are refreshed automatically while a valid refresh token remains
- Leave CRUD with overlap and balance validation
- Approval workflow: Employee applies → Manager approves/rejects → Admin oversees
- Role-based dashboard with live stats
- Filters, search, sort, pagination on leave list
- In-app notifications with unread count badge
- Swagger API docs at `/api/docs/`

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Backend | Django 4.2, Django REST Framework, PostgreSQL |
| Auth | SimpleJWT (access + refresh tokens, token blacklist) |
| Docs | drf-spectacular (Swagger / ReDoc) |
| Frontend | React 18, TypeScript, Vite |
| State | Redux Toolkit + RTK Query |
| Forms | React Hook Form + Zod |
| Styles | Tailwind CSS |
| Notifications | Toast (react-hot-toast) |

## Architecture

```
backend/
  config/          -- Django settings, root URLs
  apps/
    users/         -- Custom User model, auth views, RBAC permissions
    leaves/        -- LeaveType, LeaveBalance, LeaveRequest + approval logic
    notifications/ -- In-app notification model and views

frontend/
  src/
    store/         -- Redux store + authSlice
    api/           -- RTK Query slices (auth, leave, notification)
    components/    -- Reusable UI components
    pages/         -- Route-level page components
    types/         -- Shared TypeScript interfaces
    hooks/         -- useAuth custom hook
```

Each app follows a **repository → service → view** pattern:
- Repository: all ORM queries
- Service: all business rules (overlap check, balance check, approval flow)
- View: validates HTTP input, calls service, returns response

## Setup

### Backend

```bash
cd backend
python -m venv .venv
# Windows PowerShell: .\.venv\Scripts\Activate.ps1
# macOS/Linux: source .venv/bin/activate
pip install -r requirements.txt
copy .env.example .env
# macOS/Linux: cp .env.example .env
# Edit .env with your PostgreSQL credentials and a unique SECRET_KEY
python manage.py migrate
python manage.py shell -c "exec(open('seed_data.py').read())"
python manage.py runserver
```

API: http://localhost:8000  
Swagger: http://localhost:8000/api/docs/

### Frontend

```bash
cd frontend
npm install
npm run dev
```

App: http://localhost:5173

Public registration creates employee accounts. Admin and manager roles should be assigned by an administrator.

## Seed Accounts

| Role | Email | Password |
|------|-------|----------|
| Admin | admin@company.com | admin123 |
| Manager | manager@company.com | manager123 |
| Employee | emp1@company.com | emp123 |
| Employee | emp2@company.com | emp123 |

## API Endpoints

| Method | Path | Description |
|--------|------|-------------|
| POST | /api/auth/register/ | Register |
| POST | /api/auth/login/ | Login (returns JWT) |
| POST | /api/auth/login/refresh/ | Refresh JWT access token |
| POST | /api/auth/logout/ | Logout (blacklist token) |
| GET | /api/auth/profile/ | Own profile |
| GET | /api/auth/users/ | List users (admin) |
| GET | /api/leaves/types/ | Leave types |
| GET | /api/leaves/balances/ | Own balances |
| GET | /api/leaves/requests/ | List requests (role-scoped) |
| POST | /api/leaves/requests/apply/ | Apply for leave |
| GET | /api/leaves/requests/{id}/ | Request detail |
| DELETE | /api/leaves/requests/{id}/ | Cancel request |
| POST | /api/leaves/requests/{id}/approve/ | Approve (manager/admin) |
| POST | /api/leaves/requests/{id}/reject/ | Reject (manager/admin) |
| GET | /api/leaves/dashboard/ | Dashboard stats |
| GET | /api/notifications/ | List notifications |
| GET | /api/notifications/unread-count/ | Unread count |
| PATCH | /api/notifications/{id}/read/ | Mark one read |
| POST | /api/notifications/mark-all-read/ | Mark all read |
