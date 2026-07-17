# Enterprise Task Management & Technical Support System

A comprehensive enterprise-grade web application for task management, technical support ticketing, employee oversight, and departmental operations.

## 🚀 Features

- **Dashboard** — Interactive analytics with Chart.js (status, priority, timeline, department charts)
- **Task Management** — Full CRUD, status workflow (new → in_progress → completed/suspended/delayed → archived), notes/comments, progress tracking
- **Technical Issues** — Reporting, resolution tracking, priority-based management
- **User Management** — CRUD, suspend/activate, password reset
- **Departments** — CRUD with employee counts
- **Roles & Permissions** — Granular permission matrix (28 permissions, role-based assignment)
- **Reports** — Task, employee, department, delay, and issue reports with CSV export and print
- **Archives** — Automatic archiving of completed tasks (cron-based)
- **Audit Logs** — Complete action trail with IP tracking
- **Notifications** — Real-time notification system with unread counts
- **Dark/Light Mode** — Theme toggle with persistence
- **Responsive Design** — Mobile-first with Bootstrap 5.3
- **Security** — JWT authentication, RBAC, rate limiting, input validation

## 📋 Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | HTML5, CSS3, JavaScript (Vanilla), Bootstrap 5.3 |
| Charts | Chart.js 4.x |
| Tables | DataTables 1.13.x |
| Alerts | SweetAlert2 |
| Backend | Node.js, Express.js |
| Database | Supabase (PostgreSQL) |
| Auth | JWT (jsonwebtoken) |
| Security | Helmet, CORS, bcryptjs, express-rate-limit |

## 🏗️ Project Structure

```
enterprise-task-system/
├── database/
│   └── schema.sql              # Full PostgreSQL schema (14 tables, RLS, triggers, indexes)
├── server/
│   ├── app.js                  # Express entry point
│   ├── config/
│   │   ├── database.js         # Supabase client setup
│   │   ├── jwt.js              # JWT configuration
│   │   └── email.js            # Email transporter
│   ├── middleware/
│   │   ├── auth.js             # JWT authentication
│   │   ├── rbac.js             # Role-Based Access Control
│   │   ├── validate.js         # Input validation
│   │   ├── rateLimiter.js      # Rate limiting
│   │   └── auditLog.js         # Action logging
│   ├── routes/
│   │   ├── auth.js             # Login, register, logout, me
│   │   ├── users.js            # User CRUD
│   │   ├── departments.js      # Department CRUD
│   │   ├── roles.js            # Role management
│   │   ├── permissions.js      # Permission listing
│   │   ├── tasks.js            # Task CRUD + status workflow
│   │   ├── taskNotes.js        # Task comments
│   │   ├── technicalIssues.js  # Issue management
│   │   ├── archives.js         # Archive viewing
│   │   ├── reports.js          # Report generation
│   │   ├── notifications.js    # Notification management
│   │   ├── auditLogs.js        # Audit log viewing
│   │   └── dashboard.js        # Dashboard stats & charts
│   ├── services/
│   │   ├── notificationService.js
│   │   └── archiveService.js   # Auto-archive cron
│   ├── utils/
│   │   └── helpers.js
│   └── seeders/
│       └── seed.js             # Demo data seeder
├── public/
│   ├── index.html              # Login page
│   ├── css/
│   │   └── style.css           # Complete design system
│   ├── js/
│   │   ├── api.js              # API client
│   │   ├── app.js              # Global app logic
│   │   ├── auth.js             # Login handler
│   │   ├── dashboard.js        # Dashboard charts
│   │   ├── users.js            # User management
│   │   ├── tasks.js            # Task management
│   │   ├── taskDetail.js       # Task detail view
│   │   ├── departments.js      # Department management
│   │   ├── technicalIssues.js  # Issue management
│   │   ├── reports.js          # Report generation
│   │   ├── archives.js         # Archives view
│   │   ├── roles.js            # Roles & permissions
│   │   ├── auditLogs.js        # Audit logs view
│   │   ├── notifications.js    # Notifications view
│   │   └── profile.js          # Profile management
│   └── pages/
│       ├── dashboard.html
│       ├── users.html
│       ├── tasks.html
│       ├── task-detail.html
│       ├── departments.html
│       ├── technical-issues.html
│       ├── reports.html
│       ├── archives.html
│       ├── roles.html
│       ├── audit-logs.html
│       ├── notifications.html
│       └── profile.html
├── .env.example
├── package.json
└── README.md
```

## ⚡ Quick Start

### 1. Prerequisites
- Node.js v18+
- Supabase project (free tier works)

### 2. Setup

```bash
# Clone and enter project
cd enterprise-task-system

# Install dependencies
npm install

# Copy environment file
cp .env.example .env
```

### 3. Configure `.env`

```env
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
JWT_SECRET=your-secret-key-min-32-chars
```

### 4. Create Database

Run `database/schema.sql` in your Supabase SQL Editor to create all tables, indexes, triggers, and functions.

### 5. Seed Data

```bash
npm run seed
```

### 6. Start Server

```bash
npm run dev
```

Visit `http://localhost:3000`

## 👤 Default Credentials

| Username | Password | Role |
|----------|----------|------|
| admin | Admin@123 | Admin |
| ahmed.manager | Manager@123 | Manager |
| sara.manager | Manager@123 | Manager |
| mohammed.emp | Employee@123 | Employee |
| fatima.emp | Employee@123 | Employee |
| omar.emp | Employee@123 | Employee |
| layla.emp | Employee@123 | Employee |

## 🔐 Role Hierarchy

| Role | Access |
|------|--------|
| **Admin** | Full system access, all CRUD, user management, roles, audit logs |
| **Manager** | Department tasks, employee oversight, reports, issue viewing |
| **Employee** | Own tasks, status changes, issue reporting |

## 🎨 Design System

- **Color Palette**: Green (#1B5E20 → #C8E6C9), Gold (#B8860B → #FFE082), Neutrals
- **Typography**: Inter font family
- **Components**: Cards, badges, buttons, progress bars, timelines
- **Animations**: fadeIn, fadeInUp, slideInRight, pulse
- **Dark Mode**: Full dark theme with smooth transitions
- **Print**: Optimized print styles

## 📄 License

MIT License
