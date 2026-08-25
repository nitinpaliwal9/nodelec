FROM python:3.11-slim

WORKDIR /app

# psycopg2-binary + pandas/openpyxl wheels cover most needs without extra
# system packages, but libpq is still required at runtime for psycopg2.
RUN apt-get update \
    && apt-get install -y --no-install-recommends libpq5 \
    && rm -rf /var/lib/apt/lists/*

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

RUN mkdir -p storage/uploads

EXPOSE 8000

# BOM processing, email intake, and ERP sync all run as background
# threads inside this one process (see background_worker.py) -- no
# separate worker process/container needed anymore.
#
# Shell form (not JSON-array) deliberately -- PaaS hosts like Render
# assign a random port via $PORT and expect the app to bind to it,
# and only shell form expands environment variables. Falls back to
# 8000 when $PORT isn't set (local Docker runs, docker-compose, etc).
CMD uvicorn main:app --host 0.0.0.0 --port ${PORT:-8000}
