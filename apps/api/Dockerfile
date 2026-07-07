# Build context is the repository root: docker build -f apps/api/Dockerfile .
FROM python:3.12-slim
WORKDIR /app

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1

# requirements.txt is a pip-compile lock: exact versions + hashes. --require-hashes
# fails the build if any package or hash is missing or tampered with.
COPY apps/api/requirements.txt .
RUN pip install --no-cache-dir --require-hashes -r requirements.txt

COPY apps/api/ .

# .venv is a host-only dev artifact; never ship it in the image.
RUN rm -rf .venv && useradd --create-home appuser && chown -R appuser /app
USER appuser

EXPOSE 3000
ENTRYPOINT ["./docker-entrypoint.sh"]
