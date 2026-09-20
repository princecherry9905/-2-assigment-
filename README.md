# ♻️ EcoLoop — E-Waste Collection & Recycling Platform

> A production-grade, full-stack E-Waste Collection & Recycling management platform connecting **Citizens**, **Collection Agents**, and **Admins / Recyclers** with **Real-Time 1-to-1 Live Status Updates**, **Dual Rewards (Cash ₹ & Eco Points)**, **8-Step Journey Tracking**, and **Glassmorphism UI/UX**.

![EcoLoop Shield](https://img.shields.io/badge/EcoLoop-Sustainability%20Platform-10B981?style=for-the-badge&logo=eco)
![Stack](https://img.shields.io/badge/Node.js-Express%20%7C%20EJS%20%7C%20MongoDB-064E3B?style=for-the-badge&logo=node.js)
![Status](https://img.shields.io/badge/Deployment-Vercel%20%26%20GitHub-3B82F6?style=for-the-badge&logo=vercel)

---

## 📸 Application Interface & Mockup Previews

### 1. Citizen Dashboard & 8-Step Journey Timeline
```text
┌────────────────────────────────────────────────────────────────────────────────────────┐
│  ♻ EcoLoop     [ 🔍 Search e-waste categories... ⌘K ]   [ 🪙 820 Pts ]  [ 🔔 3 ]   Prince │
├────────────────────────────────────────────────────────────────────────────────────────┤
│                                                                                        │
│  ┌─────────────────────────────────────────┐  ┌─────────────────────────────────────┐  │
│  │ 🌿 Recycle E-Waste — Build Greener City  │  │ 👋 Good Day, Prince                 │  │
│  │    Earn Cash ₹ & Eco Points per KG      │  │    Total Pickups: 12                │  │
│  │    [ Schedule Pickup Now ]              │  │    Recycled: 42.5 KG                │  │
│  └─────────────────────────────────────────┘  │    Eco Points: 820                  │  │
│                                               └─────────────────────────────────────┘  │
│  ┌──────────────────────────────────────────────────────────────────────────────────┐  │
│  │ 📍 ACTIVE PICKUP JOURNEY — Pickup ID: #EW1024                                    │  │
│  │                                                                                  │  │
│  │    ✓ Requested  ➔  ✓ Approved  ➔  ✓ Assigned  ➔  ● Collected  ➔  5 At Centre    │  │
│  │     (10:30 AM)      (02:15 PM)     (11:00 AM)      (04:20 PM)                    │  │
│  │    ➔ 6 Sorting  ➔  7 Recycling  ➔  8 Completed (Awarded ₹250 + 🪙500 Pts)        │  │
│  └──────────────────────────────────────────────────────────────────────────────────┘  │
│                                                                                        │
│  ┌─────────────────────────────────────────┐  ┌─────────────────────────────────────┐  │
│  │ 📦 What Can You Recycle? (Live Rates)    │  │ 👛 ECO WALLET                       │  │
│  │  📱 Mobiles   : ₹50/kg • 🪙100 Pts         │  │    Balance: 820 Eco Points           │  │
│  │  💻 Laptops   : ₹70/kg • 🪙120 Pts         │  │    Cash Earned: ₹ 1,450.00          │  │
│  │  🔋 Batteries : ₹30/kg • 🪙80 Pts          │  │    [ Redeem Vouchers ]              │  │
│  │  🔌 Cables    : ₹15/kg • 🪙40 Pts          │  └─────────────────────────────────────┘  │
│  └─────────────────────────────────────────┘                                           │
└────────────────────────────────────────────────────────────────────────────────────────┘
```

---

## 🌟 Unique Concepts & Highlights

### ⚡ 1. Real-Time 1-to-1 Live Stream (SSE Engine)
Built-in Server-Sent Events stream (`/api/live-stream`). Whenever an Agent or Admin updates a pickup's status, the Citizen's screen updates the 8-step timeline and notification bell **live in real-time without reloading the browser**!

### 💰 2. Dual Reward System (Direct Money ₹ + Eco Points)
Citizens earn both **Direct Cash Money (₹/KG)** and **Eco Points (Pts/KG)** on every recycled item. Points can be redeemed for vouchers in the Eco Wallet.

### 📍 3. Granular 8-Step Pickup Lifecycle
```text
[1. Requested] ➔ [2. Approved] ➔ [3. Scheduled] ➔ [4. Collected] ➔ [5. At Centre] ➔ [6. Sorting] ➔ [7. Recycling] ➔ [8. Completed]
```

### 🏆 4. City Leaderboard & Badges Grid
Includes citizen rankings (#1 in Ghaziabad), percentile scores, monthly challenges (Recycle 10 KG), and 3D achievement badges (`First Pickup`, `10 KG Club`, `Battery Saver`, `Green Citizen`, `Eco Warrior`).

---

## 🛠 Tech Stack

- **Frontend**: EJS (Server-Side Rendering), Custom CSS (Emerald Glassmorphism System), FontAwesome 6, Google Fonts (Plus Jakarta Sans).
- **Backend**: Node.js + Express.js (MVC Architecture), Server-Sent Events (SSE).
- **Database**: MongoDB Atlas Cloud (`mongoose` with Serverless connection pool & `mongodb-memory-server` offline fallback).
- **Security & Session**: Encrypted Passwords (`bcryptjs`), Session Middleware (`express-session`), Role Guard Middleware (`isCitizen`, `isAgent`, `isAdmin`).
- **Deployment**: Vercel Serverless Function Configured (`vercel.json`) & GitHub.

---

## 📁 Project Architecture & File Layout

```text
ecoloop/
├── app.js                   # Express app, middleware, SSE route & error handlers
├── seed.js                  # Database seeder for categories, centres, users, pickups & notifications
├── vercel.json              # Vercel serverless deployment config
├── config/
│   └── db.js                # MongoDB Atlas connection handler with serverless connection reuse
├── models/
│   ├── User.js              # User schema (Citizen, Agent, Admin roles)
│   ├── PickupRequest.js     # Pickup request schema & 8-step status enum
│   ├── Category.js          # E-Waste category schema (Cash ₹/KG & Points/KG)
│   ├── CollectionCentre.js  # Logistics recycling hubs schema
│   ├── Reward.js            # Reward transaction ledger schema
│   └── Notification.js      # Real-time notifications schema
├── utils/
│   ├── realtimeStream.js    # 1-to-1 Server-Sent Events (SSE) broadcast engine
│   └── notificationHelper.js# Helper utility to create user notifications
├── routes/
│   ├── authRoutes.js        # /login, /register, /logout
│   ├── citizenRoutes.js     # /citizen/* dashboard, schedule pickup, wallet, leaderboard
│   ├── agentRoutes.js       # /agent/* assigned pickups & 1-click status transitions
│   ├── adminRoutes.js       # /admin/* approvals, agent assignment, centres, categories, analytics
│   └── notificationRoutes.js# /notifications/* mark read & clear all
├── controllers/
│   ├── authController.js
│   ├── citizenController.js
│   ├── agentController.js
│   ├── adminController.js
│   └── notificationController.js
├── views/
│   ├── auth/                # login.ejs, register.ejs
│   ├── citizen/             # dashboard.ejs, newPickup.ejs, pickups.ejs, pickupDetail.ejs, wallet.ejs, leaderboard.ejs
│   ├── agent/               # dashboard.ejs, pickups.ejs, pickupDetail.ejs
│   ├── admin/               # dashboard.ejs, requests.ejs, agents.ejs, centres.ejs, categories.ejs, statistics.ejs
│   └── partials/            # header.ejs, navbar.ejs, sidebar.ejs, footer.ejs, alerts.ejs
└── public/
    └── css/
        └── style.css        # EcoLoop Emerald Glassmorphism design system
```

---

## 🔑 Demo Logins

| Role | Email | Password | Access Capabilities |
| :--- | :--- | :--- | :--- |
| **Citizen** | `prince@ecoloop.com` | `password123` | Schedule pickups, live 8-step journey tracker, Eco Wallet, Leaderboard |
| **Agent** | `agent@ecoloop.com` | `password123` | View assigned pickups, 1-click status progression (`Scheduled` $\rightarrow$ `Collected` $\rightarrow$ `Recycled`) |
| **Admin** | `admin@ecoloop.com` | `password123` | Approve/Reject requests, assign agents/centres, manage rate cards, view analytics |

---

## 🚀 Local Installation & Quick Start

### 1. Clone & Install
```bash
git clone https://github.com/princecherry9905/assigment-2.git
cd ecoloop
npm install
```

### 2. Seed Database
```bash
npm run seed
```

### 3. Run Development Server
```bash
npm start
```
Visit `http://localhost:4000` in your browser.

---

## 🌐 Deploy to Vercel

```bash
npx vercel --prod
```
Or link the repository directly on **[vercel.com](https://vercel.com)**.

---

## 📜 License
Licensed under the ISC License. EcoLoop — Sustainability Platform.
