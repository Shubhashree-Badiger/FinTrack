# Single image: builds the React UI, then serves it from the FastAPI backend.

# Stage 1: build the static frontend. VITE_API_URL stays empty so the UI calls the same origin.
FROM node:20-alpine AS frontend
WORKDIR /web
COPY frontend/package.json ./
RUN npm install --no-package-lock
COPY frontend/index.html frontend/vite.config.js ./
COPY frontend/public ./public
COPY frontend/src ./src
RUN npm run build

# Stage 2: Python backend that also serves the built UI from /code/static.
FROM python:3.11-slim
WORKDIR /code
COPY backend/requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt
COPY backend/app ./app
COPY backend/tests ./tests
COPY backend/seed.py .
COPY --from=frontend /web/dist ./static
EXPOSE 8000
# Seed is idempotent, so it is safe to run on every start.
# Hosts such as Render set PORT; locally it defaults to 8000.
CMD ["sh", "-c", "python seed.py && uvicorn app.main:app --host 0.0.0.0 --port ${PORT:-8000}"]
