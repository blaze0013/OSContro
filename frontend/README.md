# OSContro - Frontend

Find your first open-source contribution.

## Installation

```bash
npm install
```

## Running the Development Server

```bash
npm run dev
```

## Environment Variables
Copy `.env.example` to `.env`:

- `VITE_API_BASE_URL`: URL of the FastAPI backend. Default is `http://localhost:8000`. If you are running the backend on a different laptop on the same LAN, use `http://<backend-laptop-LAN-IP>:8000`.
- `VITE_USE_MOCK`: Set to `true` to use mock data instead of calling the real backend. This bypasses Firebase auth as well, creating a fake session.
- `VITE_FIREBASE_API_KEY`: Firebase API Key.
- `VITE_FIREBASE_AUTH_DOMAIN`: Firebase Auth Domain.
- `VITE_FIREBASE_PROJECT_ID`: Firebase Project ID.
- `VITE_FIREBASE_APP_ID`: Firebase App ID.

**Note:** Never commit `.env` or put any Gemini API keys in the frontend code. Although Firebase Web config is public client info, best practice is to keep it out of git.

## Firebase Setup
1. Create a project in the [Firebase Console](https://console.firebase.google.com/).
2. Enable Authentication and turn on the **Google** and **GitHub** providers.
3. For GitHub, you must create a GitHub OAuth App and provide the callback URL from Firebase.
4. Go to Project Settings -> Web App to get your configuration keys and paste them into `.env`.
5. Under Authentication -> Settings -> Authorized Domains, make sure your production domains are added.
   *Note: Firebase Authorized Domains do not accept IP addresses (like LAN IPs). When testing locally on a two-laptop setup, open the app via `http://localhost:5173`, even though `VITE_API_BASE_URL` uses the backend's IP.*

## Build

```bash
npm run build
```
