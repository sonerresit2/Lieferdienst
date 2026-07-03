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
COPY seed.py .
COPY entrypoint.sh .

# Windows fügt beim Kopieren oft CRLF-Zeilenenden ein, die ein Linux-Container
# nicht als gültiges Shebang (#!/bin/sh) erkennt ("no such file or directory").
# sed entfernt das Carriage-Return-Zeichen \r, unabhängig vom Host-System.
RUN sed -i 's/\r$//' entrypoint.sh && chmod +x entrypoint.sh

EXPOSE 8000

CMD ["./entrypoint.sh"]
