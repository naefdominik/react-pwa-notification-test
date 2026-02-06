# PWA Push Notification Test

A proof-of-concept Progressive Web App (PWA) demonstrating push notifications triggered from a Python Flask backend.

## ✨ Features

- 🔔 Push notifications with Web Push protocol
- 🔐 VAPID authentication for secure push
- 🔒 Environment variables for secure secrets management
- ⚛️ React + TypeScript frontend
- 🐍 Python Flask backend
- 📱 Full PWA support with service worker

## 🚀 Quick Start

### Prerequisites
- Node.js and npm
- Python 3.7+

### Setup

```bash
# 1. Install frontend dependencies
npm install

# 2. Install backend dependencies
cd backend
pip3 install -r requirements.txt
cd ..

# 3. Generate VAPID keys and configure .env files
# See backend/README.md for detailed instructions

# 4. Start backend (Terminal 1)
cd backend
python3 server.py

# 5. Start frontend (Terminal 2)
npm run dev
```

### Usage

1. Open http://localhost:5173 in your browser
2. Click **"Request Permission"** to enable notifications
3. Click **"Subscribe to Notifications"** to register with the backend
4. Click **"Send Test Notification"** to receive a notification

**🔒 Security:** All secrets are stored in `.env` files (not committed to git).

## 📚 Documentation

- [backend/README.md](backend/README.md) - Backend API documentation and VAPID key generation

## 🏗️ Architecture

```
┌─────────────┐         ┌──────────────┐         ┌─────────────┐
│   React     │         │   Python     │         │   Browser   │
│   PWA       │ ◄─────► │   Flask      │ ◄─────► │   Push      │
│  (Client)   │         │  (Backend)   │         │   Service   │
└─────────────┘         └──────────────┘         └─────────────┘
      │                        │
      │                        │
      ▼                        ▼
┌─────────────┐         ┌──────────────┐
│  Service    │         │  Stored      │
│  Worker     │         │  Subscript.  │
└─────────────┘         └──────────────┘
```

## 🛠️ Built With

### Frontend
- React 19
- TypeScript
- Vite
- vite-plugin-pwa

### Backend
- Flask
- pywebpush
- py-vapid
- flask-cors
