# UrbanCart

**Everything You Need. One Better Place.**

A full-stack e-commerce platform built with React, Node.js, Express, and MongoDB — with a dual-database architecture that separates the application's data from an independent activity/audit log.

---

## Overview

UrbanCart is a complete, working online store: customers can browse, search, filter, add to cart/wishlist, check out, and track orders; admins get a real dashboard with live statistics, and full CRUD over products, categories, orders, users, and reviews. Every write to the database that matters (registrations, logins, product changes, orders, review activity, admin actions) is recorded to a **separate** audit-log database, so the application's real data and its activity trail never live in the same place.

## Features

- Customer accounts (register/login/logout) with JWT auth and bcrypt password hashing
- Product catalog with search, category/price/rating/brand/stock filters, sorting, and pagination
- Product detail pages with image gallery, specifications, and reviews
- Cart, wishlist (with move-to-cart), and a 4-step checkout flow
- **Server-calculated order totals** — the frontend never sends prices; the backend re-fetches products, verifies stock, and computes subtotal/shipping/total itself
- Order history with a visual status timeline
- Admin dashboard with real revenue/orders/users/products/low-stock statistics
- Admin CRUD for products, categories (with safe-delete guard), order status/payment status management, user role/status management, and review moderation
- Centralized audit logging to a second, independent MongoDB database
- Rate limiting, Helmet security headers, CORS locked to the configured client origin, centralized error handling
- Responsive design (320px–1440px+), loading/empty/error states throughout, accessible forms and controls

## Technology Stack

**Frontend:** React, Vite, Tailwind CSS, React Router, Axios, Lucide React, Framer Motion
**Backend:** Node.js, Express.js
**Database:** MongoDB Atlas, Mongoose
**Auth:** JWT, bcryptjs
**Security:** helmet, cors, express-rate-limit, express-validator

## Architecture

```
React (Vite)  →  REST API (Express)  →  Mongoose
                                            │
                              ┌─────────────┴─────────────┐
                              ▼                           ▼
                       PRIMARY DATABASE            TEACHER DATABASE
                  users, products, categories         AuditLog only
                  carts, orders, reviews,
                  wishlists
```

## Two-Database Architecture

UrbanCart opens **two independent Mongoose connections**:

- `primaryConnection` (`MONGODB_URI_PRIMARY`) — every real collection: `users`, `products`, `categories`, `carts`, `orders`, `reviews`, `wishlists`. This is the application's source of truth.
- `teacherConnection` (`MONGODB_URI_TEACHER`) — the `auditLogs` collection **only**. It never receives product, user, cart, or order data — only short activity records describing what happened.

Every model file in `server/models/` explicitly binds to one connection or the other (see `server/config/db.js`), so there is no code path where application data could accidentally land in the teacher database, or vice versa.

**Resilience:** if the teacher database is unreachable, `services/auditService.js` logs a warning to the server console and moves on — it never throws, never blocks a request, and never takes down the primary application.

## Project Structure

```
urban-cart/
├── client/                  # React + Vite frontend
│   ├── public/
│   └── src/
│       ├── admin/            (admin-only route target, see pages/admin)
│       ├── assets/
│       ├── components/       common/, product/, cart/, layout/, admin/, ui/
│       ├── context/          Auth, Cart, Wishlist, Toast
│       ├── hooks/
│       ├── layouts/          MainLayout, AdminLayout
│       ├── pages/            Home, ProductListing, ProductDetails, Cart, Checkout,
│       │                     Orders, OrderDetails, Wishlist, Profile, Login, Register,
│       │                     admin/ (Dashboard, Products, Categories, Orders, Users, Reviews)
│       ├── services/         api.js — centralized Axios client
│       ├── utils/
│       ├── App.jsx
│       └── main.jsx
├── server/                   # Node + Express backend
│   ├── config/db.js          dual Mongoose connections
│   ├── controllers/
│   ├── middleware/           auth, admin, error handling, rate limiting, validation
│   ├── models/               User, Product, Category, Cart, Order, Review, Wishlist, AuditLog
│   ├── routes/
│   ├── services/auditService.js
│   ├── seed/seed.js
│   ├── validators/
│   ├── app.js
│   └── server.js
├── .env.example
├── .gitignore
├── package.json               root scripts (dev, build, seed, install:all)
└── README.md
```

## Requirements

- Node.js 18+ and npm
- A MongoDB Atlas account (free tier is enough) — or any two MongoDB connection strings

## Installation

From the **repository root**:

```bash
npm run install:all
```

This installs the root, `client/`, and `server/` dependencies in one step. (Equivalent to running `npm install` in the root, `client/`, and `server/` folders separately.)

## MongoDB Atlas Setup

### Primary Database

1. Create a free account at [mongodb.com/cloud/atlas](https://www.mongodb.com/cloud/atlas) (or use an existing one).
2. Create a new Cluster (the free M0 tier is enough for this project).
3. Under **Database Access**, create a database user with a username and password.
4. Under **Network Access**, add your current IP address (or `0.0.0.0/0` for development only).
5. Click **Connect → Drivers**, copy the connection string, and put it in `.env` as `MONGODB_URI_PRIMARY`. Make sure it includes a database name, e.g.:
   ```
   MONGODB_URI_PRIMARY=mongodb+srv://<user>:<password>@<cluster>.mongodb.net/urbancart_student?retryWrites=true&w=majority
   ```

### Teacher Database

The teacher/instructor will usually provide their own MongoDB Atlas connection string for the audit database. Put it in `.env` as `MONGODB_URI_TEACHER` — do not commit it. UrbanCart only ever writes to an `auditLogs` collection there:

```
MONGODB_URI_TEACHER=mongodb+srv://<user>:<password>@<cluster>.mongodb.net/urbancart_teacher?retryWrites=true&w=majority
```

If you don't have a teacher database yet, you can leave this blank — the app still runs fully; it just skips audit logging (with a console warning) until the variable is set.

## Environment Variables

Copy `.env.example` to `.env` in the **repository root** (the server reads it via `dotenv` from `server/`, so also copy/symlink it into `server/.env`, or simply place a `.env` file inside `server/`):

```bash
cp .env.example server/.env
```

| Variable | Where | Description |
|---|---|---|
| `PORT` | server | Port the API listens on (default `5000`) |
| `CLIENT_URL` | server | Frontend origin allowed by CORS (`http://localhost:5173` in dev) |
| `JWT_SECRET` | server | Long random string used to sign JWTs — required |
| `MONGODB_URI_PRIMARY` | server | Connection string for the main application database — required |
| `MONGODB_URI_TEACHER` | server | Connection string for the audit-log database — optional but recommended |
| `ADMIN_EMAIL` / `ADMIN_PASSWORD` | server | Used only by the seed script to create a demo admin account |
| `VITE_API_URL` | client | Base URL the frontend calls, e.g. `http://localhost:5000/api` |

Never commit `.env` — it's already in `.gitignore`.

## Database Seeding

From the repository root:

```bash
npm run seed
```

This seeds the **primary** database only: 6 categories, 28 realistic products (with prices, stock, brands, ratings, and featured flags), and — if `ADMIN_EMAIL`/`ADMIN_PASSWORD` are set in `server/.env` — a demo admin account. It is safe to re-run; it upserts by slug/email instead of duplicating data.

## Running Locally

From the repository root:

```bash
npm run dev
```

This runs the backend (`http://localhost:5000`) and frontend (`http://localhost:5173`) together via `concurrently`. Or run them separately:

```bash
npm run server   # backend only, from the root
npm run client   # frontend only, from the root
```

## API Documentation

All responses follow `{ "success": true, "data": ... }` or `{ "success": false, "message": "..." }`.

| Method | Route | Auth | Description |
|---|---|---|---|
| POST | `/api/auth/register` | — | Create account |
| POST | `/api/auth/login` | — | Log in |
| GET | `/api/auth/me` | user | Current user |
| GET | `/api/products` | — | List/search/filter/sort products |
| GET | `/api/products/featured` | — | Featured products |
| GET | `/api/products/:slug` | — | Product detail + related |
| GET | `/api/products/id/:id` | admin | Fetch by id (admin edit form) |
| POST/PUT/DELETE | `/api/products[/:id]` | admin | Product CRUD |
| GET/POST/PUT/DELETE | `/api/categories[/:id]` | admin for writes | Category CRUD |
| GET/POST/PUT/DELETE | `/api/cart[/:itemId]` | user | Cart management |
| POST | `/api/orders` | user | Place order (server-calculated total) |
| GET | `/api/orders` | user/admin | List orders (`?all=true` for admin) |
| GET | `/api/orders/:id` | owner/admin | Order detail |
| PUT | `/api/orders/:id/status` | admin | Update order/payment status |
| GET/POST/DELETE | `/api/wishlist[/:productId]` | user | Wishlist management |
| POST | `/api/wishlist/:productId/move-to-cart` | user | Move item to cart |
| GET/POST | `/api/products/:id/reviews` | POST needs user | Product reviews |
| GET (admin) /PUT/DELETE | `/api/reviews[/:id]` | user/admin | Review management |
| GET | `/api/users` | admin | List users |
| PUT | `/api/users/:id/role` \| `/status` | admin | Manage a user |
| PUT | `/api/users/me` | user | Update own profile |
| GET | `/api/admin/dashboard` | admin | Live dashboard statistics |

## Admin Account

Set `ADMIN_EMAIL` and `ADMIN_PASSWORD` in `server/.env` before running `npm run seed` — this creates (or promotes) that account to the `admin` role. No admin credentials are hard-coded anywhere in the source.

## Activity/Audit Logging

`server/services/auditService.js` exposes one function, `logActivity()`, called from every controller after a meaningful write: registrations, logins, product/category/order/review/user changes, cart and wishlist updates. Each entry is written to the **teacher** database only, with fields:

```
action        e.g. "CREATE_PRODUCT"
collection    e.g. "products"
recordId      the affected document's id
userId        who performed the action
role          "customer" or "admin"
description   human-readable summary
metadata      small, sanitized extra context (never passwords/secrets)
timestamp     when it happened
```

Passwords, JWT secrets, and connection strings are never logged — `sanitizeMetadata()` strips anything matching those key names before writing.

## How Teacher Can Inspect Activity

**Using MongoDB Atlas:** open the teacher cluster in Atlas → Browse Collections → the configured database → `auditlogs` collection. Documents are sorted newest-last by default; use the filter bar, e.g. `{ "action": "CREATE_ORDER" }`.

**Using MongoDB Compass:** connect with the same `MONGODB_URI_TEACHER` string, open the database, and browse/query the `auditlogs` collection visually.

Example entries you should see after using the app:

```json
{ "action": "USER_REGISTER", "collection": "users", "description": "New user registered: jane@example.com", "role": "customer" }
{ "action": "CREATE_ORDER", "collection": "orders", "description": "Order placed — total ₹2499 (COD)", "role": "customer" }
{ "action": "UPDATE_ORDER_STATUS", "collection": "orders", "description": "Updated order ... status", "role": "admin" }
{ "action": "DELETE_PRODUCT", "collection": "products", "description": "Deleted product \"Wireless Earbuds\"", "role": "admin" }
```

## Production Build

```bash
npm run build   # builds client/dist via Vite
```

Serve the backend with `npm start` (runs `node server.js`, no nodemon). The backend does not serve the frontend build itself — deploy them separately (see below) or add static serving if you prefer a single-service deployment.

## Deployment

**Frontend** (e.g. Vercel, Netlify): deploy the `client/` folder, build command `npm run build`, output directory `dist`. Set `VITE_API_URL` to your deployed backend's `/api` URL in that platform's environment variable settings — never commit it.

**Backend** (e.g. Render, Railway, Fly.io): deploy the `server/` folder, start command `npm start`. Set `MONGODB_URI_PRIMARY`, `MONGODB_URI_TEACHER`, `JWT_SECRET`, `CLIENT_URL` (your deployed frontend URL), and optionally `ADMIN_EMAIL`/`ADMIN_PASSWORD` as secrets on the hosting platform's dashboard — never in source or in frontend env vars.

Before going live, verify:
- [ ] `npm run build` succeeds locally
- [ ] Backend doesn't reference `localhost` anywhere in code (it doesn't — CORS and API URL are both env-driven)
- [ ] `VITE_API_URL` points at the deployed backend
- [ ] `CLIENT_URL` on the backend points at the deployed frontend
- [ ] Atlas Network Access allows your hosting provider's IPs (or `0.0.0.0/0`)
- [ ] Both databases connect (check server logs on boot)
- [ ] A test order produces both an order in the primary DB and a `CREATE_ORDER` entry in the teacher DB
- [ ] Secrets are configured on the hosting platform, not in the repo

## Troubleshooting

| Symptom | Likely cause / fix |
|---|---|
| `MongoServerSelectionError` / connection failed | Check the connection string, that your IP is allow-listed in Atlas Network Access, and that the cluster is running |
| `Authentication failed` | Wrong username/password in the connection string, or special characters in the password not URL-encoded |
| Atlas IP not allowed | Add your IP (or `0.0.0.0/0` for dev) under Atlas → Network Access |
| DNS / SRV lookup errors | Usually a `mongodb+srv://` typo, or a network/firewall blocking SRV DNS lookups — try the non-SRV connection string Atlas also provides |
| CORS error in browser console | `CLIENT_URL` on the backend doesn't match the frontend's actual origin exactly (including port) |
| Port already in use | Another process is using 5000/5173 — change `PORT` or stop the other process |
| `npm install` failures | Delete `node_modules` and `package-lock.json` in the affected folder and retry; check Node version (18+) |
| `Cannot find module ...` | Run `npm run install:all` from the root again — a folder's dependencies weren't installed |
| Frontend can't reach the API | Check `VITE_API_URL` in `client/.env`, and that the backend is actually running |
| JWT errors ("invalid token", "expired") | Log out and back in; if it persists after deploy, confirm `JWT_SECRET` didn't change between deploys |
| "Invalid environment variables" / server won't boot | Compare your `.env` keys exactly against `.env.example` — names are case-sensitive |
| Wrong API URL in production | `VITE_API_URL` must be set at **build time** for Vite — rebuild after changing it |
| Broken product images | The seed data uses placeholder image URLs (`picsum.photos`); swap in your own stable image URLs for production |
| Empty database after seeding | Confirm `MONGODB_URI_PRIMARY` in `server/.env` points at the database you're browsing in Atlas/Compass |
| Seed script fails | Make sure `server/.env` exists and `MONGODB_URI_PRIMARY` is reachable before running `npm run seed` |
| Teacher database connection failure | The app degrades gracefully — the main app keeps working, and you'll see a console warning; fix `MONGODB_URI_TEACHER` and restart to resume audit logging |

## Security

- Passwords hashed with bcryptjs (never stored or returned in plaintext)
- JWT-based authentication; admin routes enforce role checks **on the backend**, not just in the UI
- helmet for security headers, CORS locked to `CLIENT_URL`, express-rate-limit on all `/api` routes (stricter on auth routes)
- express-validator on all write endpoints
- MongoDB queries built with parameterized filters (never raw string concatenation)
- Centralized error handler that never leaks stack traces in production
- Order totals always computed server-side from the live database — the client cannot influence pricing
- No secrets in frontend code, git history, or this README

## Future Improvements

- Coupon/discount codes (the `discount` field exists in the Order model but is currently always `0`)
- Real payment gateway integration (Stripe/Razorpay) in place of `TEST_PAYMENT`
- Product image upload instead of URL-only images
- Email notifications on order status changes
- Admin analytics charts (revenue over time, top products)
- Product variants (size/color)

## GitHub and secrets

- Commit `.env.example` only; keep real environment files such as `server/.env` local.
- Never commit MongoDB Atlas connection strings, JWT secrets, admin passwords, or other credentials.
- The root `.gitignore` excludes `.env` and `.env.*` files while allowing `.env.example`.
- Configure the server environment variables in `server/.env` (or your deployment provider's secret settings). Do not put server secrets in `client/` or variables prefixed with `VITE_`, because Vite exposes those values to browser code.
