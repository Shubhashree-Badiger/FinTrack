FROM python:3.11-slim

WORKDIR /code

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY app ./app
COPY tests ./tests
COPY seed.py .

EXPOSE 8000
# Seed is idempotent, so it is safe to run on every start.
# Hosts such as Render set PORT; locally it defaults to 8000.
CMD ["sh", "-c", "python seed.py && uvicorn app.main:app --host 0.0.0.0 --port ${PORT:-8000}"]
