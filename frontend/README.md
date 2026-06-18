cat > /mnt/user-data/outputs/README.md << 'ENDOFFILE'
# 💰 Budget Tracker

> **Smart personal finance tracking powered by AI** — Track expenses, set goals, and get personalized financial insights with Claude AI.

🌐 **Live Demo:** [budget-tracker.netlify.app](#) &nbsp;|&nbsp; 👨‍💻 **Author:** [SonieDev](https://github.com/SonieDev)



---

## ✨ Features

### 💸 Transaction Management
- Add income and expenses with **8 predefined categories**
- Filter by type — All / Income / Expense
- Delete transactions with smooth hover interaction
- Real-time balance calculation

### 🎯 Savings Goals
- Create goals with custom emoji icons and deadlines
- Add savings progressively over time
- Visual progress bar with percentage
- **AI-powered insights** per goal — monthly savings tips
- Edit and delete goals anytime
- 🏆 Badge when goal is completed

### 📊 Reports & Analytics
- **Bar chart** — Income vs Expenses by month
- **Line chart** — Balance evolution over time
- **Pie chart** — Spending distribution by category
- **AI Financial Report** — deep analysis powered by Claude AI

### 🤖 AI Financial Advisor
- Real-time chat powered by Claude AI
- Personalized advice based on **your actual financial data**
- Suggested questions to get started
- Conversation history maintained during session
- Responds in your language (EN / IT / FR)

### 👤 Profile & Settings
- Edit display name
- Secure password change (current password required)
- Forgot password via email link
- Export all transactions as **CSV**
- Dark / Light mode toggle
- Account deletion with double confirmation

### ⚡ Admin Dashboard
- Total users, transactions, income & expense tracked
- User management with verification status
- Platform activity statistics
- Protected — admin only access

---

## 🛠️ Tech Stack

### Frontend
| Technology | Purpose |
|-----------|---------|
| **React 19** | UI Library |
| **Vite 8** | Build tool |
| **Tailwind CSS** | Utility-first styling |
| **React Router v7** | Client-side navigation |
| **Recharts** | Charts & data visualization |
| **Supabase JS** | Auth client |

### Backend
| Technology | Purpose |
|-----------|---------|
| **FastAPI** | REST API framework |
| **Python 3.12** | Language |
| **Supabase** | PostgreSQL database + Auth |
| **Anthropic Claude** | AI features (Haiku model) |
| **Uvicorn** | ASGI server |

### Infrastructure
| Service | Purpose |
|---------|---------|
| **Supabase** | Database, Auth, Storage |
| **Render** | Backend hosting |
| **Netlify** | Frontend hosting with CDN |

---

## 🚀 Getting Started

### Prerequisites
- Python 3.12+
- Node.js 20+
- Supabase 
- Anthropic API key

### 1. Clone the repository
```bash
git clone https://github.com/SonieDev/budget-tracker.git
cd budget-tracker
```

### 2. Backend Setup
```bash
cd backend
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
```

Create `backend/.env`:
```env
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_KEY=eyJ...
ANTHROPIC_API_KEY=sk-ant-...
ADMIN_USER_ID=your-uuid-here
```

Start backend:
```bash
uvicorn main:app --reload
# API running at http://localhost:8000
```

### 3. Frontend Setup
```bash
cd frontend
npm install
```

Create `frontend/.env`:
```env
VITE_SUPABASE_URL=https://budget-tracker.supabase.co
VITE_SUPABASE_ANON_KEY=et...
```

Start frontend:
```bash
npm run dev
# App running at http://localhost:5173
```

### 4. Database Setup

Run in **Supabase SQL Editor**:

```sql
-- Transactions
CREATE TABLE transactions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL,
    type VARCHAR(10) NOT NULL CHECK (type IN ('income', 'expense')),
    amount DECIMAL(10,2) NOT NULL,
    description VARCHAR(255),
    category_name VARCHAR(100),
    category_icon VARCHAR(10),
    date DATE DEFAULT CURRENT_DATE,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Goals
CREATE TABLE goals (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL,
    name VARCHAR(100) NOT NULL,
    target_amount DECIMAL(10,2) NOT NULL,
    current_amount DECIMAL(10,2) DEFAULT 0,
    deadline DATE,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE goals ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "users see own transactions" ON transactions
FOR ALL USING ((select auth.uid()) = user_id);

CREATE POLICY "users see own goals" ON goals
FOR ALL USING ((select auth.uid()) = user_id);

-- Performance indexes
CREATE INDEX idx_transactions_user_id ON transactions(user_id);
CREATE INDEX idx_goals_user_id ON goals(user_id);
```

---

## 📡 API Reference

### Transactions
| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/transactions` | Get all user transactions |
| `POST` | `/transactions` | Create transaction |
| `DELETE` | `/transactions/{id}` | Delete transaction |
| `GET` | `/export/transactions` | Export as CSV |

### Goals
| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/goals` | Get all goals |
| `POST` | `/goals` | Create goal |
| `PATCH` | `/goals/{id}` | Add savings |
| `PATCH` | `/goals/{id}/edit` | Edit goal |
| `DELETE` | `/goals/{id}` | Delete goal |
| `GET` | `/goals/{id}/suggestion` | AI tip |

### Analytics & AI
| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/stats` | Financial summary |
| `POST` | `/ai/report` | Generate AI report |
| `POST` | `/ai/chat` | Chat with AI advisor |

### Admin
| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/admin/stats` | Platform stats |
| `GET` | `/admin/users` | All users |

---

## 🗂️ Project Structure

```
budget-tracker/
├── backend/
│   ├── main.py              # FastAPI + all endpoints
│   ├── .env                 
│   └── requirements.txt
│
└── frontend/
    ├── src/
    │   ├── pages/
    │   │   ├── Home.jsx           # Dashboard
    │   │   ├── Transactions.jsx   # Transaction management
    │   │   ├── Goals.jsx          # Savings goals
    │   │   ├── Reports.jsx        # Charts & analytics
    │   │   ├── Chat.jsx           # AI advisor
    │   │   ├── Profile.jsx        # Settings
    │   │   ├── Admin.jsx          # Admin panel
    │   │   ├── Login.jsx
    │   │   ├── Register.jsx
    │   │   ├── ForgotPassword.jsx
    │   │   └── ResetPassword.jsx
    │   ├── components/
    │   │   ├── Layout.jsx         # Main wrapper
    │   │   ├── Drawer.jsx         # Navigation
    │   │   └── ThemeProvider.jsx  # Dark/light mode
    │   ├── api.js                 # All API calls
    │   ├── supabase.js            # Supabase client
    │   └── App.jsx                # Router
    ├── .env                      
    └── package.json
```

---

## 🔐 Security

- ✅ JWT Authentication via Supabase
- ✅ Row Level Security — users access only their data
- ✅ Admin routes verified server-side
- ✅ Password change requires current password
- ✅ All secrets in environment variables
- ✅ CORS configured for production

---

## 🚢 Deployment

### Backend → Render
```
Root Directory:  backend
Build Command:   pip install -r requirements.txt
Start Command:   uvicorn main:app --host 0.0.0.0 --port $PORT
```

Add environment variables in Render dashboard.

### Frontend → Netlify
```
Base Directory:    frontend
Build Command:     npm run build
Publish Directory: frontend/dist
```

Add `frontend/public/_redirects`:
```
/*    /index.html   200
```

---

## 📄 License

MIT License — free to use and modify.

---

<div align="center">

**💰 Budget Tracker**

Built with ❤️ using FastAPI · React · Supabase · Claude AI

[![FastAPI](https://img.shields.io/badge/FastAPI-0.115-009688?style=flat&logo=fastapi)](https://fastapi.tiangolo.com)
[![React](https://img.shields.io/badge/React-19-61DAFB?style=flat&logo=react)](https://react.dev)
[![Supabase](https://img.shields.io/badge/Supabase-Database-3ECF8E?style=flat&logo=supabase)](https://supabase.com)
[![Claude AI](https://img.shields.io/badge/Claude-AI-7C3AED?style=flat)](https://anthropic.com)

⭐ **Star this repo if you find it useful!**

</div>
