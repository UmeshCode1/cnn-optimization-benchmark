FROM python:3.11-slim

WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y --no-install-recommends \
    curl \
    build-essential \
    && rm -rf /var/lib/apt/lists/*

# Install Python requirements
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy application source code
COPY . .

# Create directories for data and datasets
RUN mkdir -p /app/data/db /app/data/datasets

EXPOSE 8000

ENV PYTHONUNBUFFERED=1
ENV EXECUTION_MODE=REAL

CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
