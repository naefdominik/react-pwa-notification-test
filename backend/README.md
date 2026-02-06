# PWA Push Notification Test

A proof-of-concept Progressive Web App (PWA) with push notifications triggered from a Python backend.

## Features

- ✅ Service Worker with push notification support
- ✅ Request notification permissions
- ✅ Subscribe/unsubscribe to push notifications
- ✅ Python Flask backend for sending notifications
- ✅ VAPID key generation for secure push notifications

## Setup Instructions

### 1. Generate VAPID Keys

Generate VAPID keys for secure push notifications using one of these methods:

**Option A: Using py-vapid (Python)**
```bash
pip install py-vapid
vapid --gen
```

This outputs:
```
Private key: <private-key-pem-format>
Public key: <base64-public-key>
```

**Option B: Using web-push (Node.js)**
```bash
npx web-push generate-vapid-keys
```

### 2. Configure Environment Variables

Create `backend/.env`:
```env
VAPID_PRIVATE_KEY="-----BEGIN EC PRIVATE KEY-----\n...\n-----END EC PRIVATE KEY-----"
VAPID_PUBLIC_KEY="<your-base64-public-key>"
VAPID_EMAIL="mailto:your-email@example.com"
```

⚠️ **Important:** In the private key, replace actual newlines with `\n` (backslash-n).

Create `.env` in the project root:
```env
VITE_VAPID_PUBLIC_KEY="<your-base64-public-key>"
```

**Note:** Use the same public key in both files.

### 3. Install Backend Dependencies

```bash
cd backend
pip install -r requirements.txt
```

### 4. Install Frontend Dependencies

```bash
npm install
```

### 5. Run the Application

**Terminal 1 - Backend:**
```bash
cd backend
python server.py
```

The backend will run on http://localhost:5001

**Terminal 2 - Frontend:**
```bash
npm run dev
```

The frontend will run on http://localhost:5173 (or similar)

## Usage

1. Open the app in your browser (preferably Chrome/Edge for best PWA support)
2. Click "1. Request Permission" to allow notifications
3. Click "2. Subscribe to Notifications" to register for push notifications
4. Click "3. Send Test Notification" to trigger a notification from the backend
5. You should see a push notification appear!

## Backend API Endpoints

- `POST /subscribe` - Register a new push notification subscription
- `POST /test-notification` - Send a test notification to all subscribers
- `POST /send-notification` - Send a custom notification
  ```json
  {
    "title": "Custom Title",
    "body": "Your message here",
    "icon": "/icon.png"
  }
  ```
- `GET /subscriptions` - List all active subscriptions (debug)
- `GET /health` - Health check endpoint

## Testing from Command Line

You can also send notifications using curl:

```bash
curl -X POST http://localhost:5001/send-notification \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Hello from CLI",
    "body": "This notification was sent from the command line!"
  }'
```

## Important Notes

- **HTTPS Required**: Push notifications require HTTPS in production (except localhost)
- **Browser Support**: Best supported in Chrome, Edge, Firefox, and Safari 16+
- **Permissions**: Users must grant notification permission for push to work
- **Service Worker**: The app must be installed as a PWA or have an active service worker

## Architecture

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

## Security Considerations

- Keep your VAPID private key secret
- Never commit `vapid_keys.txt` to version control
- Use environment variables in production
- Implement proper authentication for backend endpoints in production
- Validate and sanitize all user inputs

## Troubleshooting

**Notifications not working?**
- Check browser console for errors
- Ensure service worker is registered
- Verify VAPID keys are correctly configured
- Check notification permissions in browser settings
- Try in an incognito window to test fresh state

**Backend errors?**
- Ensure all Python dependencies are installed
- Check that VAPID keys are properly formatted
- Verify CORS is enabled for your frontend domain

## License

MIT
