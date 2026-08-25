#!/bin/sh
# Runs both the FastAPI web process and the Celery worker in the same
# container/machine. They share the local filesystem (storage/uploads),
# which the worker relies on to read files the web process just saved --
# running them as separate Fly machines would break that, since local
# disk isn't shared across machines without object storage. If this ever
# needs to scale beyond one machine, switch storage to S3-compatible
# object storage first and split these back into separate process groups.
set -e

celery -A worker.celery_app worker --loglevel=info --concurrency=2 &
CELERY_PID=$!

trap 'kill -TERM $CELERY_PID 2>/dev/null' TERM INT

uvicorn main:app --host 0.0.0.0 --port 8000 &
UVICORN_PID=$!

wait $UVICORN_PID
