# FinTrack – Smart Expense & Savings Management System

FinTrack is a web application for tracking daily expenses, setting monthly budgets per category, and managing savings goals. A FastAPI backend with a PostgreSQL database and a React UI, packaged and deployed together as one Docker image.

## Author

Shubhashree B Badiger, B.E. Computer Science (AI & ML), Vidyavardhaka College of Engineering, Mysuru

## Features
Accounts:
- Landing page with an overview of the app, plus **Sign up**, **Sign in** (username and password) and a **Demo** button that opens a ready-made account with data for the current month.
- Every user has private data. New accounts start empty with default categories.

Core:
- Log, edit and delete daily expenses, each in a category (Food, Transport, Entertainment, Bills, Shopping, Health, Other, or your own).
- Set a monthly budget for each category.
- Dismissible UI alerts when a category budget is exceeded.
- Total spending per month.
- Spending vs budget per category.

Extras:
- Different budgets for different months.
- "Low" alert when 10% or less of a budget is left.
- Bar chart of budget vs spent (Recharts). Categories with no spending show as zero.
- Savings goals with contributions and progress bars.
- **CSV import:** download a template, upload it (or a bank statement export) and review every row before saving. Categories are guessed from the description, new ones are created, and duplicates are skipped.
- **Installable app (PWA):** an Install app button, a manifest, icons and a service worker. On phones the layout switches to a top bar with bottom tabs and a centre + button, like a native app.
- All amounts in Indian Rupees (₹), loading and empty states on every page, responsive layout.

Alert status (`ok`, `low`, `exceeded`, `no_budget`) is calculated by the backend on demand. The UI only displays it.

Validation: expense, budget and goal amounts must be greater than zero (HTTP 422 otherwise), and budget calculations never divide by zero.

## Accounts and the demo
- Sign up with a name, a username (letters, numbers, `.` and `_`) and a password of at least 6 characters. Passwords are stored as salted PBKDF2 hashes (`backend/app/security.py`); the API uses signed bearer tokens.
- The **Try the demo** button calls `POST /auth/demo`. The demo user (username `demo`, password `demo1234`) is created or refreshed on every call, so it always has this month's expenses, budgets (one "low" and one "exceeded" alert), last month's history and three savings goals. The demo account is shared, so changes made in it are visible to other demo visitors.

## Environment variables
| Variable | Used by | Purpose |
| --- | --- | --- |
| `DATABASE_URL` | app | PostgreSQL URL. `postgres://` and `postgresql://` are converted to the psycopg2 driver automatically. |
| `SECRET_KEY` | app | Signs login tokens. Set a long random value in production. |
| `DB_SSL` | app | `true` when connecting over the public internet (Render External URL). |
| `STATIC_DIR` | app | Folder with the built UI. `static` in the Docker image. |
| `POSTGRES_DB`, `POSTGRES_USER`, `POSTGRES_PASSWORD` | Docker Compose | Database container settings. |
| `FRONTEND_ORIGIN` | app | Extra CORS origin, only needed when the UI runs separately (`npm run dev`). |

Copy `.env.example` to `.env` for local Docker runs. `.env` is git-ignored and must never be committed.

## Architecture

Three tiers. The UI and API ship in one container, the database in another:

- **Presentation:** React + Vite, plain CSS, Recharts (`frontend/`).
- **Application:** FastAPI with routers, a service layer, Pydantic schemas and SQLAlchemy models (`backend/`). Routers validate input and call services; all business logic is in `services/`.
- **Data:** PostgreSQL 16, accessed only through the SQLAlchemy 2.x ORM.

```
fintrack/
├── Dockerfile          (builds the UI, then the backend that serves it)
├── docker-compose.yml
├── render.yaml         (Render Blueprint: web service + PostgreSQL)
├── README.md
├── .env.example
├── backend/
│   ├── requirements.txt
│   ├── seed.py
│   ├── app/
│   │   ├── main.py, database.py, config.py
│   │   ├── models/     (user, category, expense, budget, savings_goal)
│   │   ├── schemas/    (expense, category, budget, report, savings_goal)
│   │   ├── services/   (expense, budget, alert, report, goal)
│   │   └── routers/    (auth, categories, expenses, budgets, alerts, reports, goals, importer)
│   └── tests/          (conftest.py, test_alerts.py, test_auth.py, test_import.py, test_validation_reports.py)
└── frontend/
    ├── package.json, vite.config.js, index.html
    └── src/
        ├── main.jsx, App.jsx, api.js, styles.css
        ├── pages/        (Landing, AuthPage, Dashboard, Expenses, Budgets, Reports, Goals, Import)
        └── components/   (AlertBanner, ExpenseForm, ExpenseList, BudgetForm, BudgetChart, GoalCard)
```

Every record belongs to one user. The seed script creates or refreshes the shared demo account.

## Prerequisites

- Docker
- Docker Compose

## How to run

```bash
cp .env.example .env
docker compose up --build
```

- UI and API (same address): http://localhost:8000
- Swagger: http://localhost:8000/docs

The backend waits for the PostgreSQL healthcheck, creates the tables, and seeds demo data on start.

## Seeding demo data

The app container runs `python seed.py` on every start. It is idempotent: it creates or refreshes the demo account (username `demo`) with categories, budgets, expenses for the current and previous month, and savings goals, without duplicating anything that already exists. It also upgrades older databases that were created before login existed. To run it manually:

```bash
docker compose exec app python seed.py
```

To start from scratch, remove the database volume: `docker compose down -v`.

## API summary

All endpoints except `/health` and `/auth/register`, `/auth/login`, `/auth/demo` need the header `Authorization: Bearer <token>`.

| Method | Path | Purpose |
| --- | --- | --- |
| GET | `/health` | Liveness check |
| POST | `/auth/register` | Create an account, returns a token |
| POST | `/auth/login` | Sign in, returns a token |
| POST | `/auth/demo` | Sign in as the demo user |
| GET | `/import/template` | Download the CSV template (no login needed) |
| POST | `/import/expenses?dry_run=true` | Validate CSV text and return a preview. Use `dry_run=false` to save |
| GET | `/auth/me` | Current user |
| GET, POST | `/categories` | List or create categories |
| GET | `/expenses?month=YYYY-MM&category_id=` | List expenses with optional filters |
| POST | `/expenses` | Create an expense (response includes `alert`) |
| PUT | `/expenses/{id}` | Update an expense (response includes `alert`) |
| DELETE | `/expenses/{id}` | Delete an expense |
| GET | `/budgets?month=YYYY-MM` | List budgets for a month |
| PUT | `/budgets` | Upsert a budget by category, month and year |
| GET | `/alerts?month=YYYY-MM` | Alert status for each category with a budget |
| GET | `/reports/monthly-total?month=YYYY-MM` | Total spend for the month |
| GET | `/reports/budget-vs-spend?month=YYYY-MM` | Budget, spent, remaining and status per category |
| GET, POST | `/goals` | List or create savings goals |
| PATCH | `/goals/{id}/contribute` | Add an amount to a goal |

Sample requests (replace the month with the current one):

```bash
curl http://localhost:8000/health
TOKEN=$(curl -s -X POST http://localhost:8000/auth/demo | python -c "import sys,json;print(json.load(sys.stdin)['token'])")

curl -H "Authorization: Bearer $TOKEN" "http://localhost:8000/alerts?month=2026-11"

curl -X POST http://localhost:8000/expenses -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"category_id": 1, "amount": "25.50", "spent_on": "2026-11-10", "description": "Lunch"}'

curl -X PUT http://localhost:8000/budgets -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"category_id": 1, "month": 11, "year": 2026, "amount": "500"}'
```

## Manual test checklist
1. Open http://localhost:8000. You should see the landing page.
2. Click **Try the demo**. The dashboard shows rupee amounts, a red "Entertainment: budget exceeded" alert and an amber "Food: almost out" alert. Click the x on an alert and confirm it disappears.
3. Press **Add expense** (or the + button on a phone), add an expense, and confirm a message appears and the dashboard totals update. On the Expenses page, delete an expense and confirm the alerts refresh.
4. Go to Budgets, change a budget, then switch the month and confirm budgets are independent per month.
5. Open Reports and confirm the table and chart match the data. Choose a month with no data and confirm the "Nothing to chart yet" message.
6. Go to Goals, create a savings goal, add money, and confirm the progress bar.
7. Go to Import, click **Download template**, open it, then upload it back. Confirm the preview shows 5 rows, press **Import 5 expenses** and check them under Expenses (use the month in the file, November 2026). Upload the same file again and confirm it reports 5 duplicates and nothing new to import.
8. Sign out, click **Get started** and create an account. Confirm the dashboard shows the "Your account is ready" steps and no data from the demo.
9. In the new account: set a Food budget of 1000, add Food expenses of 500 (on track), then 410 (amber, 9% left), then 100 (red, exceeded).
10. Sign out, sign in again with the same username and password. Try a wrong password and confirm "Invalid username or password".
11. Install as an app: in Chrome or Edge open the site and click **Install app** (sidebar, or the install icon in the address bar). On an iPhone use Share, then Add to Home Screen. Open the installed app and confirm it opens full screen with its own icon. Resize the window below 860 px (or open it on a phone) and confirm the bottom tab bar appears.
12. API check: open http://localhost:8000/docs, call `GET /expenses?month=2026-11` without a token and confirm HTTP 401.
13. Run the backend tests: `docker compose exec app pytest` (expected: all pass).

## Importing expenses (CSV format)
| Column | Required | Notes |
| --- | --- | --- |
| `date` | yes | `2026-11-05`, `05/11/2026` or `05-11-2026`. Bank names such as `Txn Date` also work. |
| `amount` | yes | `1250.50`, `1,250.50` or `â‚¹ 1250`. Bank names such as `Debit` or `Withdrawal Amt` also work. Empty or zero rows (credits) are skipped. |
| `category` | no | Matched ignoring case. A new name creates a new category. If empty, it is guessed from the description (Swiggy becomes Food, Uber becomes Transport) or set to Other. |
| `description` | no | Also matched from `Narration`, `Particulars` or `Remarks`. |

Up to 2000 rows per file. A row with the same date, amount and description as an existing expense is skipped as a duplicate.
## Deploying on Render
The UI and API run as one web service, so there is a single URL and no CORS or `VITE_API_URL` setup.

**Option A: Blueprint (fastest).** In Render choose New, then Blueprint, and select this repo. `render.yaml` creates the `fintrack-db` PostgreSQL database and the `fintrack` web service and wires `DATABASE_URL` between them.

**Option B: manually.**
1. Create the database: New, then PostgreSQL. Name it `fintrack-db`, pick a region, and wait until it is Available. Copy the **Internal Database URL**.
2. Create the web service: New, then Web Service, connect this repo. Runtime Docker, **Root Directory empty** (the repo root), Dockerfile Path `./Dockerfile`, same region as the database. Health Check Path `/health`.
3. Environment variables: `DATABASE_URL` is the Internal Database URL (`postgres://` is converted automatically); `SECRET_KEY` is a long random string (the Blueprint generates one). Set `DB_SSL=true` only if you use the External Database URL.

Open the web service URL to see the UI. The API is on the same address (for example `/health`, `/docs`, `/categories`). The backend creates the tables and seeds demo data on start. Free web services sleep after 15 minutes without traffic, so the first request after a pause can take about a minute. Render's free PostgreSQL instances expire after about 30 days, so check the plan before a deadline.

## Run without Docker
Needs Python 3.11+, Node 20+ and a running PostgreSQL. The values in `.env` apply to the Docker setup; export `DATABASE_URL` (see `.env.example`) for this mode.
```bash
cd backend && pip install -r requirements.txt && python seed.py && uvicorn app.main:app --port 8000
cd frontend && npm install && npm run dev      # UI on http://localhost:5173, calls the API on :8000
```
The UI on port 5173 needs `FRONTEND_ORIGIN=http://localhost:5173` (the default) for CORS. To serve the built UI from the backend instead, run `npm run build` and start uvicorn with `STATIC_DIR=../frontend/dist`.

## Troubleshooting

- **Port already in use (8000):** stop the process using it, or change the left side of the `ports` mapping in `docker-compose.yml`.
- **Database not ready:** the backend starts only after the PostgreSQL healthcheck passes, which can take up to a minute on the first run. Check progress with `docker compose logs db`.
- **UI shows a network error:** confirm the app is up at http://localhost:8000/health and check `docker compose logs app`.
- **Stale data or schema:** run `docker compose down -v` and start again.
