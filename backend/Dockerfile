FROM python:3.12-slim

WORKDIR /app

# Systemabhängigkeiten für psycopg2 (PostgreSQL-Treiber)
RUN apt-get update && apt-get install -y --no-install-recommends \
    gcc \
    libpq-dev \
    && rm -rf /var/lib/apt/lists/*

# Abhängigkeiten zuerst kopieren und installieren -> nutzt Docker-Layer-Caching,
# damit bei Code-Änderungen nicht jedes Mal neu installiert werden muss.
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Anwendungscode kopieren
COPY app ./app

EXPOSE 8000

CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
