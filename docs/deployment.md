# Deployment Guide

The CNN Optimization Benchmark can be deployed locally, via Docker container, or deployed to cloud hosting environments (such as Hostinger, AWS, GCP, Render, Vercel, or DigitalOcean).

## 1. Local Development
```bash
# 1. Install Backend Requirements
python -m pip install -r requirements.txt

# 2. Start FastAPI Backend
cd backend
python -m uvicorn main:app --host 0.0.0.0 --port 8000 --reload

# 3. Start Frontend Dev Server
cd ../frontend
npm install
npm run dev
```

## 2. Docker Deployment
```bash
# Build and start services
docker-compose up --build -d

# Application is available at http://localhost:8000
```

## 3. Production Single-Process Deployment
When `frontend/dist` is built (`npm run build`), FastAPI automatically mounts and serves the static production SPA on the root path `/`.
