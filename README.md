# FinTrack – Smart Expense & Savings Management System

FinTrack is a web application for tracking daily expenses, setting monthly budgets per category, and managing savings goals. A FastAPI backend with a PostgreSQL database serves a separate React UI.

## Author

Shubhashree B Badiger, B.E. Computer Science (AI & ML), Vidyavardhaka College of Engineering, Mysuru

## Features

Core:
- Log daily expenses and assign each to a category (Food, Transport, Entertainment, Bills, Shopping).
- Set a monthly budget for each category.
- UI alerts when a category budget is exceeded.
- Total spending per month.
- Spending vs budget per category.

Extras:
- Different budgets for different months.
- "Low" alert when 10% or less of a budget is left.
- Bar chart of budget vs spent (Recharts).
- Savings goals with contributions and progress bars.
- React UI with a month selector shared across pages.

Alert status (`ok`, `low`, `exceeded`, `no_budget`) is calculated by the backend on demand. The UI only displays it.

## Architecture

Three tiers, each in its own container:

- **Presentation:** React + Vite, plain CSS, Recharts (`frontend/`).
- **Application:** FastAPI with routers, a service layer, Pydantic schemas and SQLAlchemy models (`backend/`). Routers validate input and call services; all business logic is in `services/`.
- **Data:** PostgreSQL 16, accessed only through the SQLAlchemy 2.x ORM.

```
fintrack/
├── docker-compose.yml
├── README.md
├── .env.example
├── backend/
│   ├── Dockerfile
│   ├── requirements.txt
│   ├── seed.py
│   ├── app/
│   │   ├── main.py, database.py, config.py
│   │   ├── models/     (user, category, expense, budget, savings_goal)
│   │   ├── schemas/    (expense, category, budget, report, savings_goal)
│   │   ├── services/   (expense, budget, alert, report, goal)
│   │   └── routers/    (categories, expenses, budgets, alerts, reports, goals)
│   └── tests/          (conftest.py, test_alerts.py)
└── frontend/
    ├── Dockerfile, package.json, vite.config.js, index.html
    └── src/
        ├── main.jsx, App.jsx, api.js, styles.css
        ├── pages/        (Dashboard, Expenses, Budgets, Reports, Goals)
        └── components/   (AlertBanner, ExpenseForm, ExpenseList, BudgetForm, BudgetChart, GoalCard)
```

There is no login. A single default user is created by the seed script and owns all records.

## Prerequisites

- Docker
- Docker Compose

## How to run

```bash
cp .env.example .env
docker compose up --build
```

- UI: http://localhost:5173
- API: http://localhost:8000
- Swagger: http://localhost:8000/docs

The backend waits for the PostgreSQL healthcheck, creates the tables, and seeds demo data on start.

## Seeding demo data

The backend container runs `python seed.py` on every start. It is idempotent: it inserts the default user, the categories Food/Transport/Entertainment/Bills/Shopping, and sample expenses and budgets for the current month only if the database is empty. To run it manually:

```bash
docker compose exec backend python seed.py
```

To start from scratch, remove the database volume: `docker compose down -v`.

## API summary

| Method | Path | Purpose |
| --- | --- | --- |
| GET | `/health` | Liveness check |
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

curl "http://localhost:8000/alerts?month=2026-11"

curl -X POST http://localhost:8000/expenses \
  -H "Content-Type: application/json" \
  -d '{"category_id": 1, "amount": "25.50", "spent_on": "2026-11-10", "description": "Lunch"}'

curl -X PUT http://localhost:8000/budgets \
  -H "Content-Type: application/json" \
  -d '{"category_id": 1, "month": 11, "year": 2026, "amount": "500"}'
```

## Manual test checklist

1. Open the UI at http://localhost:5173 and confirm seeded data appears on the Dashboard.
2. Go to Expenses, add an expense, and confirm it appears in the list.
3. Go to Budgets and set a Food budget for the current month.
4. Add Food expenses until about 90% of the budget is used and confirm the amber "low" alert.
5. Add one more expense past the budget and confirm the red "exceeded" alert.
6. Change the month in the selector and confirm budgets and totals are independent per month.
7. Open Reports and confirm the table and chart match the data.
8. Go to Goals, create a savings goal, contribute an amount, and confirm the progress bar.
9. Run the backend tests: `docker compose exec backend pytest`.

## Deploying on Render
1. **Database:** in Render choose New, then PostgreSQL. Give it a name (for example `fintrack-db`), pick the same region you will use for the backend, and choose a plan. Once it is Available, open it and copy the **Internal Database URL**.
2. **Backend (Web Service, Docker):** Root Directory `backend`, Dockerfile Path `./Dockerfile`, same region as the database. Environment variables:
   - `DATABASE_URL`: the Internal Database URL from step 1 (`postgres://` is converted automatically)
   - `FRONTEND_ORIGIN`: the frontend URL from step 3, without a trailing slash
   - `DB_SSL`: set to `true` only if you use the External Database URL (for example when connecting from your own machine)
3. **Frontend (Static Site):** Root Directory `frontend`, Build Command `npm install && npm run build`, Publish Directory `dist`. Environment variable `VITE_API_URL`: the backend URL, without a trailing slash. Redeploy the frontend after changing it, because Vite reads it at build time.

The backend creates the tables and seeds demo data on start. Free web services sleep after 15 minutes without traffic, so the first request after a pause can take about a minute. Render's free PostgreSQL instances expire after about 30 days, so check the plan before a deadline.
## Troubleshooting

- **Port already in use (5173 or 8000):** stop the process using it, or change the left side of the `ports` mapping in `docker-compose.yml`.
- **Database not ready:** the backend starts only after the PostgreSQL healthcheck passes, which can take up to a minute on the first run. Check progress with `docker compose logs db`.
- **UI shows a network error:** confirm the backend is up at http://localhost:8000/health and that `VITE_API_URL` and `FRONTEND_ORIGIN` in `.env` match the URLs you use in the browser.
- **Stale data or schema:** run `docker compose down -v` and start again.
