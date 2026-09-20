# EcoLoop — E-Waste Collection & Recycling Pickup System

> A modern, full-stack E-Waste Collection & Recycling management platform connecting **Citizens**, **Collection Agents**, and **Admins / Recyclers**.

![EcoLoop Visual Identity](https://img.shields.io/badge/Design-EcoLoop-10B981)
![Stack](https://img.shields.io/badge/Tech-Node.js%20%7C%20Express%20%7C%20EJS%20%7C%20MongoDB-0F382C)

---

## 🌟 Project Vision & Unique Concept

**EcoLoop** connects households and offices with e-waste recyclers while rewarding eco-conscious citizens with category-wise **Eco Points**.

### The EcoLoop Workflow:
$$\text{Request} \longrightarrow \text{Schedule} \longrightarrow \text{Collect} \longrightarrow \text{Recycle} \longrightarrow \text{Reward} \longrightarrow \text{Repeat}$$

---

## 🛠 Tech Stack

- **Frontend**: EJS (Server-Side Rendering), Custom CSS (EcoLoop Design System), FontAwesome Icons, Google Fonts (Plus Jakarta Sans)
- **Backend**: Node.js + Express.js (MVC Architecture)
- **Database**: MongoDB Atlas / Mongoose (with `mongodb-memory-server` zero-config fallback)
- **Authentication**: Session-Based Authentication (`express-session` + `bcryptjs` + role-based access control middleware)

---

## 📁 MVC Architecture Directory Layout

```
ecoloop/
├── app.js                   # Express application entry point & middleware configuration
├── seed.js                  # Database seeding script for categories, centres, users & pickups
├── config/
│   └── db.js                # MongoDB connection handler with MongoMemoryServer fallback
├── models/
│   ├── User.js              # User schema (Citizen, Agent, Admin roles)
│   ├── PickupRequest.js     # Pickup request lifecycle schema & tracking data
│   ├── Category.js          # E-Waste category rate schema (Reward Pts / KG)
│   ├── CollectionCentre.js  # Logistics collection centres schema
│   └── Reward.js            # Reward wallet transaction ledger schema
├── routes/
│   ├── authRoutes.js        # /login, /register, /logout
│   ├── citizenRoutes.js     # /citizen/* dashboard, pickup creation, visual timeline, wallet
│   ├── agentRoutes.js       # /agent/* assigned pickups & status transition workflow
│   └── adminRoutes.js       # /admin/* approvals, agent assignment, centres, categories, analytics
├── controllers/
│   ├── authController.js
│   ├── citizenController.js
│   ├── agentController.js
│   └── adminController.js
├── middleware/
│   └── authMiddleware.js    # Session check & strict role guard middleware
├── views/
│   ├── auth/                # login.ejs, register.ejs
│   ├── citizen/             # dashboard.ejs, newPickup.ejs, pickups.ejs, pickupDetail.ejs, wallet.ejs
│   ├── agent/               # dashboard.ejs, pickups.ejs, pickupDetail.ejs
│   ├── admin/               # dashboard.ejs, requests.ejs, agents.ejs, centres.ejs, categories.ejs, statistics.ejs
│   └── partials/            # header.ejs, navbar.ejs, footer.ejs, alerts.ejs
├── public/
│   └── css/
│       └── style.css        # Custom EcoLoop sustainability design system
├── .env                     # Environment variables configuration
└── package.json
```

---

## 🚀 Quick Start Guide

### 1. Install Dependencies
```bash
npm install
```

### 2. Seed Initial Demo Data
```bash
npm run seed
```

### 3. Start the Server
```bash
npm start
```
Visit the app at `http://localhost:3000`.

---

## 🔑 Demo Test Accounts

| Role | Email | Password | Access Capabilities |
| :--- | :--- | :--- | :--- |
| **Citizen** | `prince@ecoloop.com` | `password123` | Create pickups, visual tracking timeline, view reward wallet balance |
| **Agent** | `agent@ecoloop.com` | `password123` | View assigned pickups, update status (Scheduled &rarr; Collected &rarr; Recycled) |
| **Admin** | `admin@ecoloop.com` | `password123` | Approve/Reject requests, assign agents/centres, manage categories, view analytics |

---

## ⚡ Core Features & Role Capabilities

### 👤 1. Citizen Role
- **Category Selection**: Choose from Mobiles (100 Pts/KG), Batteries (80 Pts/KG), Appliances (50 Pts/KG), Cables (40 Pts/KG).
- **Interactive Pickup Form**: Set weight in KG, quantity, address, and preferred pickup date.
- **Visual Status Timeline**:
  ```
  Requested ───► Scheduled ───► Collected ───► Recycled
  ```
- **Reward Wallet**: Earns points automatically upon item recycling ($\text{Weight} \times \text{Points/KG}$). Prevents duplicate reward entries.

### 🚚 2. Collection Agent Role
- **Agent Dashboard**: Summary of assigned, scheduled, collected, and recycled pickups.
- **Today's Schedule**: Quick access to today's pickups with citizen contact & address.
- **Status Updater**: Simple dropdown workflow to transition status from `Scheduled` &rarr; `Collected` &rarr; `Recycled`.

### 🏢 3. Admin / Recycler Role
- **Request Approvals**: Review pending pickup requests, approve, or reject with a custom reason.
- **Logistics Assignment**: Assign collection agents and nearest collection centre.
- **Category & Rate Manager**: Configure reward points per KG for each category.
- **Collection Centre Manager**: Add, edit, and toggle active status of collection facilities.
- **Analytics & Breakdown**: Category-wise e-waste volume bars, area distribution, and status funnel metrics.
