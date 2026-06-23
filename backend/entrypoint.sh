#!/bin/sh
# entrypoint.sh — wird vom Docker-Container beim Start ausgeführt.

echo "Starte Seed..."
python seed.py

echo "Starte Backend..."
exec uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
