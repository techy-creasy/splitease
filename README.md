# SplitEase – Expense Splitter App

A full-stack Splitwise-like expense splitting application built with React, Node.js, Express, and MongoDB.

---

## 📁 Folder Structure

```
expense-splitter/
├── backend/
│   ├── config/
│   │   └── db.js                    # MongoDB connection
│   ├── controllers/
│   │   ├── auth.controller.js       # Register, login, getMe
│   │   ├── group.controller.js      # CRUD for groups, member management
│   │   ├── expense.controller.js    # Add/get/delete expenses
│   │   └── balance.controller.js    # Balance calculations
│   ├── middleware/
│   │   └── auth.middleware.js       # JWT protect middleware
│   ├── models/
│   │   ├── User.js                  # User schema (name, email, password)
│   │   ├── Group.js                 # Group schema (name, members, createdBy)
│   │   └── Expense.js              # Expense schema (groupId, amount, paidBy, splitAmong)
│   ├── routes/
│   │   ├── auth.routes.js
│   │   ├── group.routes.js
│   │   ├── expense.routes.js
│   │   └── balance.routes.js
│   ├── services/
│   │   └── balance.service.js       # Core balance calculation algorithm
│   ├── .env.example
│   ├── package.json
│   └── server.js                    # Express app entry point
│
└── frontend/
    ├── public/
    │   └── index.html
    ├── src/
    │   ├── api/
    │   │   └── index.js             # Axios instance + all API calls
    │   ├── components/
    │   │   ├── auth/
    │   │   │   └── ProtectedRoute.js
    │   │   └── common/
    │   │       └── Navbar.js
    │   ├── context/
    │   │   └── AuthContext.js       # Global auth state (React Context)
    │   ├── pages/
    │   │   ├── LoginPage.js
    │   │   ├── RegisterPage.js
    │   │   ├── DashboardPage.js     # Group list + create group
    │   │   └── GroupDetailsPage.js  # Expenses, balances, members
    │   ├── App.js                   # Routes
    │   ├── index.js
    │   └── index.css                # Tailwind + global styles
    ├── .env.example
    ├── package.json
    └── tailwind.config.js
```

---

## 🚀 Setup Instructions

### Prerequisites
- Node.js v18+
- MongoDB (local) or MongoDB Atlas (cloud)
- npm or yarn

---

### 1. Clone / Setup the project

```bash
# Navigate into backend
cd expense-splitter/backend

# Install dependencies
npm install
```

### 2. Configure Backend Environment

```bash
# Copy example env
cp .env.example .env
```

Edit `.env`:
```env
PORT=5000
MONGODB_URI=mongodb://localhost:27017/expense-splitter
JWT_SECRET=your_super_secret_key_change_this
JWT_EXPIRES_IN=7d
NODE_ENV=development
CLIENT_URL=http://localhost:3000
```

> **MongoDB Atlas:** Replace `MONGODB_URI` with your Atlas connection string.
> Example: `mongodb+srv://username:password@cluster.mongodb.net/expense-splitter`

### 3. Start the Backend

```bash
# Development (with auto-reload)
npm run dev

# Production
npm start
```

Backend will run on **http://localhost:5000**

---

### 4. Setup Frontend

```bash
cd ../frontend
npm install
```

### 5. Configure Frontend Environment

```bash
cp .env.example .env
```

Edit `.env`:
```env
REACT_APP_API_URL=http://localhost:5000/api
```

### 6. Start the Frontend

```bash
npm start
```

Frontend will run on **http://localhost:3000**

---

## 🔌 API Reference

### Auth
| Method | Route | Description | Auth |
|--------|-------|-------------|------|
| POST | `/api/auth/register` | Register new user | No |
| POST | `/api/auth/login` | Login user | No |
| GET | `/api/auth/me` | Get current user | Yes |

### Groups
| Method | Route | Description | Auth |
|--------|-------|-------------|------|
| POST | `/api/groups` | Create group | Yes |
| GET | `/api/groups` | Get all user's groups | Yes |
| GET | `/api/groups/:id` | Get single group | Yes |
| DELETE | `/api/groups/:id` | Delete group (creator only) | Yes |
| POST | `/api/groups/:id/members` | Add member by email | Yes |
| DELETE | `/api/groups/:id/members/:memberId` | Remove member | Yes |

### Expenses
| Method | Route | Description | Auth |
|--------|-------|-------------|------|
| POST | `/api/expenses` | Add expense to group | Yes |
| GET | `/api/expenses/:groupId` | Get group expenses | Yes |
| DELETE | `/api/expenses/:id` | Delete expense (creator) | Yes |

### Balances
| Method | Route | Description | Auth |
|--------|-------|-------------|------|
| GET | `/api/balances/:groupId` | Get balance summary | Yes |

---

## ⚙️ Balance Calculation Algorithm

The core algorithm in `backend/services/balance.service.js`:

**Example:**
- Dinner: ₹900, paid by Rahul, split among Rahul, Aastha, Aman
- Share per person = ₹900 / 3 = ₹300

**Raw balance calculation:**
- Rahul: +900 (paid) − 300 (share) = **+600**
- Aastha: −300 (share) = **−300**
- Aman: −300 (share) = **−300**

**Greedy settlement (minimizes transactions):**
- Aastha → Rahul: ₹300
- Aman → Rahul: ₹300

---

## ✨ Features

- 🔐 JWT authentication with bcrypt password hashing
- 👥 Group management (create, delete, add/remove members)
- 💸 Expense tracking (add, delete, per-person split display)
- ⚖️ Real-time balance calculation
- 🤝 Optimal settlement suggestions (greedy algorithm)
- 📱 Fully responsive mobile-first UI
- 🔔 Toast notifications for all actions
- 🛡️ Protected routes with auth guards
- 🌐 Axios interceptors for token management

---

## 🛠️ Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18, React Router v6, Axios, Tailwind CSS |
| Backend | Node.js, Express.js |
| Database | MongoDB, Mongoose |
| Auth | JWT, bcryptjs |
| Notifications | react-hot-toast |

---

## 🧪 Testing the API

You can test the backend with curl or Postman:

```bash
# Register
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"name":"Rahul","email":"rahul@test.com","password":"secret123"}'

# Login
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"rahul@test.com","password":"secret123"}'

# Create group (use token from login)
curl -X POST http://localhost:5000/api/groups \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{"groupName":"Goa Trip"}'
```
