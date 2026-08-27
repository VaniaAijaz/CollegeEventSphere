# 🎓 CollegeEventSphere (EventSphere)

[![Tech Stack](https://img.shields.io/badge/Stack-MERN%20(React%2019%20%2B%20Express%205%20%2B%20Node%20%2B%20MongoDB)-blue.svg)](#-tech-stack)
[![Tailwind CSS](https://img.shields.io/badge/TailwindCSS-v4.0-38bdf8.svg)](#-frontend-architecture)
[![Vite](https://img.shields.io/badge/Bundler-Vite%208-646cff.svg)](#-frontend-architecture)
[![License](https://img.shields.io/badge/License-MIT-green.svg)](#)

> **CollegeEventSphere** is an end-to-end, role-based campus event management and stall allocation platform built on the modern **MERN** stack (React 19, Node.js, Express 5, MongoDB). It unifies event discovery, ticketing with scannable QR codes, automated waitlists, interactive stall/booth floor plans, media galleries, and administrative governance under one unified portal.

> **Production documentation:** [22-page system documentation](docs/CollegeEventSphere-Documentation.html) with architecture, ERD, DFD, flowcharts, API map, RBAC, deployment and readiness notes.

---

## 📑 Table of Contents

- [✨ Key Features](#-key-features)
- [👥 Role-Based Access Control (RBAC)](#-role-based-access-control-rbac)
- [🛠️ Tech Stack](#️-tech-stack)
- [📁 Project Architecture & Directory Structure](#-project-architecture--directory-structure)
- [🚀 What Has Been Built & Working Status](#-what-has-been-built--working-status)
- [⚙️ Getting Started & Installation](#️-getting-started--installation)
  - [Prerequisites](#prerequisites)
  - [1. Backend Setup](#1-backend-setup)
  - [2. Frontend Setup](#2-frontend-setup)
  - [3. Database Seeding](#3-database-seeding)
- [🔑 Demo Credentials](#-demo-credentials)
- [📡 API Reference](#-api-reference)
- [🎨 UI & Design Highlights](#-ui--design-highlights)
- [🔮 Future Roadmap](#-future-roadmap)

---

## ✨ Key Features

- 🎟️ **Event Discovery & Smart Filtering**: Explore technical fests, cultural nights, workshops, sports, and seminars with live text search, category filters, department tagging, and sorting.
- ⚡ **Automated Registration & Waitlist Queue**: One-click registration with atomic seat reservation. If an event reaches full capacity, users join a smart waitlist that auto-promotes when spots free up.
- 📱 **QR Code Digital Passes & Attendance**: Instant dynamic QR code generation embedded with cryptographic tokens. Organizers can scan passes on-site to log attendance.
- 🏢 **Interactive Booth & Stall Floor Plan Visualizer**: Dynamic visual matrix grid for campus exhibitions, hackathon booths, and vendor stalls. Admins can bulk-generate floor layouts (e.g., A1–D10), and organizers can reserve booths in real-time.
- 📸 **Campus Event Gallery**: Filterable photo gallery by event category with client-side modal views, upload support, and automatic asset management.
- 🔔 **Real-Time Notification Hub**: In-app notifications and automated Nodemailer HTML emails for registrations, waitlist promotions, and campus announcements.
- 🛡️ **Comprehensive Admin Governance**: Metrics dashboard, event moderation queue (Approve/Reject), user management (role assignment & account suspension), and broadcast messaging.
- 🌓 **Modern UI/UX**: Dark and light theme modes, glassmorphism accents, Framer Motion page transitions, responsive design, and Sonner toast notifications.

---

## 👥 Role-Based Access Control (RBAC)

The application enforces fine-grained role-based access for 3 primary personas:

| Feature / Action | 🎓 Participant (Student) | 🧑‍🏫 Organizer (Faculty / Club) | 👑 Admin (Administration) |
| :--- | :---: | :---: | :---: |
| **Browse & Search Events** | ✅ | ✅ | ✅ |
| **Register & Receive QR Pass** | ✅ | ✅ | ✅ |
| **View Digital Tickets & Certificates** | ✅ | ✅ | ✅ |
| **Cancel Registration / Auto-Promote Waitlist** | ✅ | ✅ | ✅ |
| **Submit New Event (for Approval)** | ❌ | ✅ (Status: `pending`) | ✅ (Status: `upcoming`) |
| **Edit / Manage Own Events** | ❌ | ✅ | ✅ |
| **Scan Attendee QR Codes** | ❌ | ✅ (Own events) | ✅ (All events) |
| **View & Book Available Booths** | View Only | ✅ | ✅ |
| **Create & Bulk-Generate Booths** | ❌ | ❌ | ✅ |
| **Approve / Reject Submitted Events** | ❌ | ❌ | ✅ |
| **Manage Users & Change Roles** | ❌ | ❌ | ✅ |
| **Suspend / Activate User Accounts** | ❌ | ❌ | ✅ |
| **Broadcast System Announcements** | ❌ | ❌ | ✅ |

---

## 🛠️ Tech Stack

### Frontend
- **Framework**: [React 19](https://react.dev/) + [Vite 8](https://vitejs.dev/)
- **Routing**: [React Router v7](https://reactrouter.com/) (Lazy-loaded routes with `AnimatePresence`)
- **Styling**: [Tailwind CSS v4](https://tailwindcss.com/) with `@tailwindcss/vite`
- **UI Components & Icons**: Radix UI Primitives (Dialog, Select, Tabs, Avatar, Dropdown), [Lucide React](https://lucide.dev/)
- **Animations**: [Framer Motion](https://www.framer.com/motion/) (smooth route transitions & animated stat counters)
- **Forms & Validation**: [React Hook Form](https://react-hook-form.com/) with [Zod](https://zod.dev/)
- **Notifications**: [Sonner](https://sonner.emilkowal.ski/) rich toast notifications
- **HTTP Client**: [Axios](https://axios-http.com/) (configured with JWT interceptors & auto-refresh/logout)

### Backend
- **Runtime**: [Node.js](https://nodejs.org/) (ES Modules)
- **Web Framework**: [Express 5](https://expressjs.com/)
- **Database**: [MongoDB](https://www.mongodb.com/) via [Mongoose 9](https://mongoosejs.com/)
- **Authentication**: JWT (JSON Web Tokens) with `bcryptjs` encryption (12 rounds) & `cookie-parser`
- **Security**: [Helmet](https://helmetjs.github.io/) (configured for cross-origin media), [express-rate-limit](https://www.npmjs.com/package/express-rate-limit) (global & auth limiters)
- **File & Media Storage**: [Multer](https://github.com/expressjs/multer) with [Cloudinary](https://cloudinary.com/) integration for event banners & disk storage for gallery
- **Ticketing & Attendance**: [QRCode](https://www.npmjs.com/package/qrcode) library + Cryptographic token hashing
- **Email Service**: [Nodemailer](https://nodemailer.com/) with custom responsive HTML templates

---

## 📁 Project Architecture & Directory Structure

```
CollegeEventSphere/
├── client/                           # Frontend React Application
│   ├── public/                       # Static public assets
│   ├── src/
│   │   ├── assets/                   # Images and logos
│   │   ├── components/
│   │   │   ├── events/               # EventCard, EventFilters, etc.
│   │   │   ├── layout/               # Navbar, Footer
│   │   │   └── ui/                   # Radix/Tailwind UI primitives (button, dialog, select, etc.)
│   │   ├── context/
│   │   │   ├── AuthContext.jsx       # Authentication state, login, register, profile updates
│   │   │   └── ThemeContext.jsx      # Dark / Light theme provider
│   │   ├── data/
│   │   │   └── mockData.js           # Sample events, categories, and departments fallback
│   │   ├── lib/
│   │   │   ├── api.js                # Axios instance with centralized API method mappings
│   │   │   └── utils.js              # ClassName merge helpers (clsx + tailwind-merge)
│   │   ├── pages/
│   │   │   ├── About.jsx             # About campus event platform
│   │   │   ├── AdminDashboard.jsx    # System metrics, user management, event approvals
│   │   │   ├── Contact.jsx           # Support and contact inquiries
│   │   │   ├── Dashboard.jsx         # Student hub (Registrations, QR Passes, Certificates)
│   │   │   ├── EventBooths.jsx       # Interactive stall / booth floor plan visualizer
│   │   │   ├── EventDetail.jsx       # Single event breakdown, registration, & info
│   │   │   ├── Events.jsx            # Event search, filtering, and catalog
│   │   │   ├── Gallery.jsx           # Campus event photo gallery with filters
│   │   │   ├── Home.jsx              # Landing page with hero, featured fests, and stats
│   │   │   ├── Login.jsx             # Sign in page
│   │   │   ├── OrganizerDashboard.jsx# Organizer event submissions, attendee list, QR scanner
│   │   │   ├── Register.jsx          # Student/user account creation
│   │   │   └── Sitemap.jsx           # Full site navigation map
│   │   ├── App.jsx                   # Route provider with animated page transitions
│   │   ├── index.css                 # Global CSS & Tailwind configuration
│   │   └── main.jsx                  # React application entry point
│   ├── package.json
│   └── vite.config.js
│
├── server/                           # Backend Express Application
│   ├── config/
│   │   └── db.js                     # MongoDB connection configuration
│   ├── controllers/
│   │   ├── adminController.js        # Stats, user toggling, role updates, announcements
│   │   ├── authController.js         # Register, login, profile updates, session check
│   │   ├── boothController.js        # Floor plan CRUD, bulk matrix generator, booking
│   │   ├── eventController.js        # Event CRUD, approval, search, category filters
│   │   ├── galleryController.js      # Gallery photo upload, listing, and removal
│   │   ├── notificationController.js # In-app notification management
│   │   └── registrationController.js # Event registration, QR issuance, waitlists, scanner
│   ├── middleware/
│   │   ├── auth.js                   # JWT verification (`protect`) & RBAC (`authorize`)
│   │   ├── upload.js                 # Multer disk upload config for gallery
│   │   └── validate.js               # Express-validator error handler
│   ├── models/
│   │   ├── Booth.js                  # Stall model (number, size, price, booking status)
│   │   ├── Event.js                  # Event model (dates, venue, seats, status, tags)
│   │   ├── Gallery.js                # Photo gallery items & categories
│   │   ├── Notification.js           # In-app user notifications
│   │   ├── Registration.js           # User registration, QR tokens, attendance status
│   │   └── User.js                   # User profile, role, hashed password, stats
│   ├── routes/
│   │   ├── adminRoutes.js            # `/api/admin`
│   │   ├── authRoutes.js             # `/api/auth`
│   │   ├── boothRoutes.js            # `/api/booths`
│   │   ├── eventRoutes.js            # `/api/events`
│   │   ├── galleryRoutes.js          # `/api/gallery`
│   │   ├── notificationRoutes.js     # `/api/notifications`
│   │   └── registrationRoutes.js     # `/api/registrations`
│   ├── scripts/
│   │   └── seed.js                   # Database seeder for demo accounts & mock events
│   ├── utils/
│   │   ├── cloudinary.js             # Cloudinary SDK & Multer storage configuration
│   │   ├── email.js                  # Nodemailer transport & HTML mail templates
│   │   └── jwt.js                    # JWT signing & cookie helpers
│   ├── .env.example                  # Environment variable template
│   ├── package.json
│   └── server.js                     # Server entry point & middleware pipeline
│
└── README.md                         # Complete project documentation
```

---

## 🚀 What Has Been Built & Working Status

### 1. Authentication & Security
- [x] **User Registration**: Validates name, college email, 10-digit phone, enrollment number, and department.
- [x] **User Login & Session Handling**: Secure JWT issuance with localStorage sync and cookie fallback.
- [x] **Role Protection**: Strict route guards for `participant`, `organizer`, and `admin`.
- [x] **Rate Limiting & Helmet**: Protection against brute-force attacks and cross-origin resource isolation.

### 2. Events Engine
- [x] **Event Creation with Image Uploads**: Organizers can upload banner images (Cloudinary) and set deadlines, venues, categories, and total capacity.
- [x] **Admin Approval Pipeline**: Organizer-created events default to `pending` until approved by an administrator.
- [x] **Full-Text Search & Multi-Filter**: Real-time search across titles, descriptions, categories, and departments.
- [x] **Event Details View**: Includes real-time remaining seat counter, progress bar, event tags, organizer contact, and venue directions.

### 3. Registration & Ticketing System
- [x] **Instant Registration**: Checks seat capacity, handles race conditions, and confirms spot atomically.
- [x] **Automated Waitlisting**: When seats fill up, users are automatically placed on a FIFO waitlist.
- [x] **Dynamic QR Pass Generation**: Produces a scannable Base64 Data URL QR Code tied to a unique `qrToken`.
- [x] **Email Dispatch**: Sends HTML ticket confirmation directly to the student's email.
- [x] **Auto-Promotion on Cancellation**: When a confirmed attendee cancels, the next waitlisted user is automatically upgraded, issued a QR ticket, and notified.
- [x] **On-Site Attendance Scanner**: Organizer portal to scan QR tokens and mark student attendance.

### 4. Interactive Booth / Stall Floor Plan Visualizer
- [x] **Floor Plan Matrix View**: Renders dynamic 2D stall grids (e.g. Rows A–Z, Columns 1–50) with color coding (Green = Booked, Amber = Available).
- [x] **Admin Bulk Booth Generator**: Admins can generate entire exhibition halls in seconds by specifying rows and columns.
- [x] **Single Booth Management**: Full CRUD for custom booth numbers, pricing tiers (small, medium, large), and descriptions.
- [x] **Organizer Real-Time Booking**: Organizers can click available stalls to reserve them or cancel their reservations.

### 5. Dashboards
- [x] **Student Dashboard**: Displays registered events, viewable/downloadable QR passes, certificates, notification inbox, and profile settings.
- [x] **Organizer Dashboard**: Tracks hosted events, submissions, attendance metrics, and quick link to event booth allocation.
- [x] **Admin Dashboard**: Real-time metric counters, pending event moderation list, user directory with suspension and role promotion toggles, and global announcement dispatcher.

### 6. Media Gallery & Informational Pages
- [x] **Filterable Gallery**: Category-based photo feed with modal preview and upload support.
- [x] **Static Pages**: Complete About, Contact, FAQ, and Interactive HTML Sitemap pages.

---

## ⚙️ Getting Started & Installation

### Prerequisites
- **Node.js**: v18.0.0 or higher
- **MongoDB**: Local instance running on `mongodb://localhost:27017` or a [MongoDB Atlas](https://www.mongodb.com/atlas) URI
- **Cloudinary Account** (Optional for banner uploads; uses fallback defaults if omitted)
- **Gmail / SMTP Account** (Optional for email delivery)

---

### ⚡ Quickstart (Run Server + Client Together)

From the project root:

1. **Install all dependencies:**
   ```bash
   npm run install:all
   ```

2. **Start both Server and Client concurrently:**
   ```bash
   npm run dev
   ```
   - **Backend API**: `http://localhost:5000`
   - **Frontend App**: `http://localhost:5173`

---

### 1. Backend Setup (Individual)

1. Open a terminal and navigate to the `server` directory:
   ```bash
   cd server
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Create your `.env` configuration file:
   ```bash
   cp .env.example .env
   ```

4. Configure your `.env` variables:
   ```env
   PORT=5000
   MONGO_URI=mongodb://localhost:27017/collegeeventsphere
   JWT_SECRET=your_super_secret_jwt_key_change_this_in_production
   JWT_EXPIRES_IN=7d
   CLIENT_URL=http://localhost:5173

   # Cloudinary (Optional for custom event images)
   CLOUDINARY_CLOUD_NAME=your_cloud_name
   CLOUDINARY_API_KEY=your_api_key
   CLOUDINARY_API_SECRET=your_api_secret

   # Nodemailer (Optional for email confirmations)
   MAIL_HOST=smtp.gmail.com
   MAIL_PORT=587
   MAIL_USER=your_email@gmail.com
   MAIL_PASS=your_app_password
   MAIL_FROM="EventSphere <noreply@eventsphere.edu>"

   NODE_ENV=development
   ```

5. Start the backend development server:
   ```bash
   npm run dev
   ```
   The server will run on `http://localhost:5000`.

---

### 2. Frontend Setup

1. Open a new terminal and navigate to the `client` directory:
   ```bash
   cd client
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Start the Vite development server:
   ```bash
   npm run dev
   ```
   The client will run on `http://localhost:5173`.

---

### 3. Database Seeding

Populate the database with pre-configured users (Admin, Organizer, Student) and rich mock events:

```bash
cd server
node scripts/seed.js
```

---

## 🔑 Demo Credentials

Once the seed script is executed, you can log in with any of the following accounts:

| Role | Email | Password | Access Privileges |
| :--- | :--- | :--- | :--- |
| **👑 Administrator** | `admin@college.edu` | `admin123` | Full admin dashboard, user management, event approvals, booth layout generator |
| **🧑‍🏫 Organizer** | `organizer@college.edu` | `org123` | Event creation, QR attendance scanner, attendee lists, stall booking |
| **🎓 Participant (Student)** | `student@college.edu` | `student123` | Event registration, QR ticket pass view/download, notifications |

---

## 📡 API Reference

### 🔐 Authentication (`/api/auth`)
- `POST /api/auth/register` — Register a new student/user account.
- `POST /api/auth/login` — Authenticate user and receive JWT.
- `POST /api/auth/logout` — Clear auth session and cookies.
- `GET  /api/auth/me` — Fetch currently authenticated user profile.
- `PATCH /api/auth/update-profile` — Update user profile information.

### 🎪 Events (`/api/events`)
- `GET    /api/events` — Retrieve paginated list of events with search & category filters.
- `GET    /api/events/:id` — Retrieve single event details.
- `GET    /api/events/organizer/my` — Get all events created by the logged-in organizer.
- `POST   /api/events` — Create new event (multipart/form-data with image).
- `PATCH  /api/events/:id` — Update event details.
- `DELETE /api/events/:id` — Delete event (Admin only).
- `PATCH  /api/events/:id/approve` — Approve pending event (Admin only).
- `PATCH  /api/events/:id/reject` — Reject / cancel pending event (Admin only).

### 🎟️ Registrations & Attendance (`/api/registrations`)
- `POST   /api/registrations/:eventId` — Register for an event / join waitlist.
- `DELETE /api/registrations/:eventId` — Cancel registration (auto-promotes waitlisted users).
- `GET    /api/registrations/my` — Get current student's registered events and QR passes.
- `GET    /api/registrations/event/:eventId` — Get all attendees for a specific event (Organizer/Admin).
- `POST   /api/registrations/scan` — Validate QR token and mark attendance (Organizer/Admin).

### 🏢 Booths & Stalls (`/api/booths`)
- `GET    /api/booths/event/:eventId` — Get all stalls for an event formatted for floor plan visualizer.
- `POST   /api/booths` — Create a single stall (Admin).
- `POST   /api/booths/bulk` — Bulk generate a matrix grid of stalls (Admin).
- `PATCH  /api/booths/:id` — Update stall details or pricing (Admin).
- `DELETE /api/booths/:id` — Delete stall (Admin).
- `POST   /api/booths/:id/book` — Reserve/book an available stall (Organizer).
- `POST   /api/booths/:id/cancel` — Cancel a stall reservation (Booking Organizer).

### 🔔 Notifications (`/api/notifications`)
- `GET   /api/notifications` — Fetch user's notification feed.
- `PATCH /api/notifications/read-all` — Mark all notifications as read.
- `PATCH /api/notifications/:id/read` — Mark single notification as read.

### 📸 Gallery (`/api/gallery`)
- `GET    /api/gallery` — Get photo gallery items with category filter.
- `POST   /api/gallery` — Upload a new gallery picture (Admin/Organizer).
- `DELETE /api/gallery/:id` — Delete gallery item and unlink file (Admin/Organizer).

### 👑 Admin Management (`/api/admin`)
- `GET   /api/admin/stats` — Get platform KPI statistics.
- `GET   /api/admin/users` — Paginated user directory with search and role filter.
- `PATCH /api/admin/users/:id/toggle` — Suspend or activate user account.
- `PATCH /api/admin/users/:id/role` — Update user role (`participant`, `organizer`, `admin`).
- `POST  /api/admin/announce` — Dispatch broadcast announcement to targeted user roles.

---

## 🎨 UI & Design Highlights

- **Neo-Brutalism Design System**: The entire platform features a striking Neo-Brutalism theme (inspired by Gumroad/Linear) using bold high-contrast colors, harsh shadows (`brut-box`), and sharp rounded corners for a premium, modern feel.
- **Color Palette**: Utilizes Deep Purple (`#67568C`) as a primary base, complimented by Teal (`#008080`), Royal Pastel Blue (`#DBDCE8`), Blueberry Mauve (`#AAA3B4`), and Vibrant Gold (`#F9BC60`).
- **Floorplan & Legends**: Interactive Booths use highly-distinguishable pastel-tinted zones with clear contrasting dots/legends to avoid color clutter, ensuring immediate readability.
- **Modern Typography & Glassmorphism**: Utilizes clean Inter-based font hierarchy, subtle borders, frosted glass navigation, and curated slate/indigo accent palettes.
- **Micro-Interactions**: Hover lifts, tactile button presses, smooth accordion transitions, and interactive floor plan hover cards.
- **Responsive Layout**: Designed for mobile phones, tablets, and desktop displays with responsive sidebars and drawer menus.

---

## 🔮 Features & Enhancements

- [x] **Automated Verified Certificate Generator**: High-resolution canvas/credential download on attendance confirmation with serial ID.
- [x] **Calendar Sync**: Export event registrations directly to Google Calendar and iCal (`.ics`).
- [x] **Digital Ticket & QR Pass Wallet**: Instant QR pass modal with attendee details and token verification.
- [ ] **Payment Gateway Integration**: Stripe / Razorpay integration for paid workshops and premium booth bookings.
- [ ] **Live Chat & Q&A**: Real-time event question-and-answer channels via Socket.io.

---

## 🛠️ Recent Development Work

### Bug Fixes & Refactoring
- **Backend Configuration**: Fixed `server/package.json` to correctly point to the backend `.env` file using `--env-file=.env` instead of `--env-file=../.env`, which resolved MongoDB connection issues on startup.
- **React Hooks**: Resolved `react-hooks/rules-of-hooks` errors across multiple components (`AdminDashboard.jsx`, `OrganizerDashboard.jsx`, `Dashboard.jsx`, and `EventBooths.jsx`) by reordering conditional early returns below all `useEffect` hooks.
- **JSX Syntax**: Fixed a build-failing syntax error in `AdminDashboard.jsx` (Adjacent JSX elements) by wrapping the root return in a React Fragment (`<>...</>`).
- **Linter Warnings**: Resolved React immutability warnings in `AdminDashboard.jsx` by hoisting the `fetchGallery` function definition.

### Neo-Brutalism UI Overhaul
- Updated global `index.css` with a refined Neo-Brutalism aesthetic.
- Added rounded corners (`border-radius: 0.75rem`) to cards, buttons, and inputs for a professional look.
- Refined `Navbar.jsx`, `Footer.jsx`, `Home.jsx`, and interior dashboard pages to utilize brutalist shadows and consistent color palettes, replacing the default yellow scheme with a sophisticated Deep Purple, Indigo, and Rose design.

---

## 📄 License

This project is licensed under the **MIT License**. Feel free to use and adapt it for your college or organization.
