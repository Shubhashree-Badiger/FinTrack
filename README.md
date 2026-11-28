# FinTrack v2 – Simple Expense Tracker

A simple web application to track daily expenses against monthly budgets. Python (FastAPI) backend, PostgreSQL database, and a separate React UI, all running locally.

## Author

Shubhashree B Badiger, B.E. Computer Science (AI & ML), Vidyavardhaka College of Engineering, Mysuru

## Features

- Register and login (password hashed with bcrypt, JWT token)
- Log daily expenses (add, edit, delete)
- Expenses are categorized (Food, Transport, Entertainment, Bills, Shopping are created for every new user; you can add more)
- Set a monthly budget for each category
- Red alert in the UI when a category budget is exceeded
- Reports: total spending per month, and spending vs budget per category

Each user only sees their own data.

## Tech stack

| Part | Technology |
| --- | --- |
| Backend | Python, FastAPI, SQLAlchemy 2.x (ORM), Pydantic |
| Database | PostgreSQL (local) |
| Frontend | React + Vite, plain CSS |

## Folder structure

```
backend/
  app/
    main.py        FastAPI app, CORS, routers, creates tables on startup
    config.py      settings from .env
    database.py    SQLAlchemy engine and session
    models.py      users, categories, expenses, budgets
    schemas.py     request/response models
    security.py    password hashing, JWT, current user
    services.py    monthly totals and budget status logic
    routers/       auth, categories, expenses, budgets, reports
  requirements.txt
  .env.example
frontend/
  src/
    App.jsx        login/register switch, navigation, month selector
    api.js         API calls with the login token
    pages/         Login, Register, Dashboard, Expenses, Budgets
    styles.css
```

## Prerequisites

- Python 3.11 or newer
- Node.js 18 or newer
- PostgreSQL 14 or newer, running locally

## 1. Create the database

Open **psql** (or pgAdmin) and run:

```sql
CREATE DATABASE fintrack;
```

Tables are created automatically when the backend starts.

## 2. Run the backend

```bash
cd backend
python -m venv .venv
.venv\Scripts\activate          # Windows
# source .venv/bin/activate     # macOS / Linux
pip install -r requirements.txt
copy .env.example .env          # Windows  (cp on macOS / Linux)
```

Edit `backend/.env` and put your PostgreSQL password in `DATABASE_URL`:

```
DATABASE_URL=postgresql+psycopg2://postgres:YOUR_PASSWORD@localhost:5432/fintrack
SECRET_KEY=any-long-random-string
FRONTEND_ORIGIN=http://localhost:5173
```

Start the server:

```bash
uvicorn app.main:app --reload
```

- API: http://localhost:8000
- Swagger docs: http://localhost:8000/docs

## 3. Run the frontend

In a second terminal:

```bash
cd frontend
npm install
npm run dev
```

Open http://localhost:5173.

## API summary

All endpoints except `/health`, `/auth/register` and `/auth/login` need the header `Authorization: Bearer <token>`.

| Method | Path | Purpose |
| --- | --- | --- |
| POST | `/auth/register` | Create account, returns token |
| POST | `/auth/login` | Login, returns token |
| GET, POST | `/categories` | List or add categories |
| GET | `/expenses?month=YYYY-MM` | List expenses for a month |
| POST | `/expenses` | Add expense (response includes budget status) |
| PUT | `/expenses/{id}` | Edit expense (response includes budget status) |
| DELETE | `/expenses/{id}` | Delete expense |
| GET | `/budgets?month=YYYY-MM` | List budgets for a month |
| PUT | `/budgets` | Set or update a category budget for a month |
| GET | `/reports/summary?month=YYYY-MM` | Monthly total and spending vs budget per category |

Budget status per category: `exceeded` if spent > budget, `ok` otherwise, `no_budget` if no budget is set for that month.

### Sample requests (Swagger is easiest: click **Authorize** and paste the token)

```bash
curl -X POST http://localhost:8000/auth/register -H "Content-Type: application/json" -d "{\"name\":\"Shubha\",\"email\":\"shubha@test.com\",\"password\":\"secret1\"}"
```

Response:

```json
{"access_token": "eyJ...", "token_type": "bearer", "name": "Shubha"}
```

```bash
curl -X POST http://localhost:8000/expenses -H "Authorization: Bearer TOKEN" -H "Content-Type: application/json" -d "{\"category_id\":3,\"amount\":\"450\",\"spent_on\":\"2026-11-12\"}"
```

Response when the Food budget is 400:

```json
{"id": 1, "category_id": 3, "amount": "450.00", "description": "", "spent_on": "2026-11-12",
 "alert": {"category_name": "Food", "budget": "400.00", "spent": "450.00", "remaining": "-50.00", "status": "exceeded"}}
```

## Manual test checklist

1. Open http://localhost:5173 and click **Register**. Create an account (name, email, password of 6+ characters). You land on the Dashboard.
2. Click **Logout**, then log in with the same email and password. A wrong password shows "Invalid email or password".
3. Go to **Budgets** and set Food = `400` for the current month. Click **Save**.
4. Go to **Expenses** and add: amount `300`, category Food, today's date, description `Groceries`. It appears in the list and no alert is shown.
5. Add another Food expense of `150`. A red banner shows "Food: budget exceeded. Spent 450.00 of 400.00."
6. Click **Edit** on the `150` expense, change it to `50` and save. The banner disappears.
7. Open **Dashboard**: total spending is `350.00`, and the table shows Food with budget 400, spent 350, remaining 50, status ok. Other categories show "no budget".
8. Change the month selector to the next month: total is `0` and there are no budgets. Budgets are separate for each month.
9. Delete an expense and confirm the totals update.
10. Register a second account and confirm it does not see the first account's expenses.

## Troubleshooting

- **"Cannot reach the backend"** in the UI: start the backend (step 2) and check http://localhost:8000/health.
- **`password authentication failed`** when starting the backend: the password in `DATABASE_URL` is wrong.
- **`database "fintrack" does not exist`**: run step 1.
- **Port in use**: run the backend on another port with `uvicorn app.main:app --port 8001` and start the frontend with `VITE_API_URL=http://localhost:8001`.
