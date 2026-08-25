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

RUN chmod +x start.sh

EXPOSE 8000

CMD ["./start.sh"]
