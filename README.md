# ORION Mobile

ORION is a personal AI assistant Android app built with **React Native 0.76**. It features JWT-based authentication, real-time chat with an AI backend (Groq / Llama3-70B), persistent message history, and a clean dark-themed UI.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | React Native 0.76 (TypeScript) |
| Navigation | React Navigation v7 (Native Stack) |
| State Management | Zustand v5 |
| HTTP Client | Axios |
| Local Storage | AsyncStorage |
| List Rendering | @shopify/flash-list |
| Keyboard Handling | react-native-keyboard-controller |
| Safe Area | react-native-safe-area-context |

---

## Project Structure

```
orion-mobile/
├── src/
│   ├── components/
│   │   ├── ChatBubble.tsx       # Individual message bubble (user/assistant)
│   │   ├── InputBar.tsx         # Text input + send button
│   │   ├── TypingIndicator.tsx  # Animated typing dots while AI responds
│   │   └── index.ts
│   ├── screens/
│   │   ├── LoginScreen.tsx      # JWT login flow
│   │   ├── RegisterScreen.tsx   # New user registration
│   │   ├── ChatScreen.tsx       # Main chat interface
│   │   └── index.ts
│   ├── services/
│   │   ├── api.ts               # Axios instance + auth/chat API calls
│   │   ├── storage.ts           # AsyncStorage helpers (token, user, messages)
│   │   └── index.ts
│   ├── store/
│   │   ├── authStore.ts         # Zustand auth state (login, register, logout)
│   │   ├── chatStore.ts         # Zustand chat state (send, history, streaming)
│   │   └── index.ts
│   ├── types/                   # Shared TypeScript types
│   └── utils/                   # Utility helpers
├── App.tsx                      # Root navigator (Auth stack / Chat stack)
├── index.js                     # App entry point
├── .env.example                 # Environment variable template
└── package.json
```

---

## Prerequisites

- **Node.js** >= 18
- **React Native CLI** environment set up ([official guide](https://reactnative.dev/docs/environment-setup))
- **Android Studio** + Android SDK (API 21+)
- ORION backend running locally or deployed ([orion-backend](https://github.com/chiku0210/orion-backend))

---

## Getting Started

### 1. Clone & Install

```bash
git clone https://github.com/chiku0210/orion-mobile.git
cd orion-mobile
npm install
```

### 2. Configure Environment

```bash
cp .env.example .env
```

Edit `.env`:

```env
# Android emulator points to host machine at 10.0.2.2
API_BASE_URL=http://10.0.2.2:3000

# For physical device, use your machine's LAN IP
# API_BASE_URL=http://192.168.x.x:3000
```

### 3. Start Metro

```bash
npm start
```

### 4. Run on Android

```bash
npm run android
```

---

## Available Scripts

| Script | Description |
|---|---|
| `npm start` | Start Metro bundler |
| `npm run android` | Build and run on Android |
| `npm run ios` | Build and run on iOS |
| `npm test` | Run Jest tests |
| `npm run lint` | ESLint check |
| `npm run format` | Prettier format all files |
| `npm run format:check` | Check formatting without writing |

---

## Features (Phase 1)

- **Authentication** — Register and login with JWT tokens persisted via AsyncStorage
- **Chat Interface** — Real-time messaging UI with user and AI bubbles
- **Typing Indicator** — Animated dots while the AI generates a response
- **Chat History** — Messages fetched from the backend on session restore
- **State Management** — Zustand stores for auth (`authStore`) and chat (`chatStore`)
- **API Layer** — Centralized Axios client with automatic token injection via interceptors
- **Local Persistence** — Token, user info, and messages cached with AsyncStorage helpers

---

## Backend

This app connects to the ORION backend API. Make sure the backend is running before launching the app.

Backend repo: [chiku0210/orion-backend](https://github.com/chiku0210/orion-backend)

Expected endpoints:

| Method | Endpoint | Description |
|---|---|---|
| POST | `/auth/register` | Register a new user |
| POST | `/auth/login` | Login and receive JWT |
| POST | `/chat/send` | Send a message, get AI response |
| GET | `/chat/history` | Fetch past conversation messages |

---

## Troubleshooting

- **Metro can't connect** — Make sure `API_BASE_URL` in `.env` matches where the backend is running.
- **Android emulator network** — Use `10.0.2.2` to reach the host machine, not `localhost`.
- **Physical device** — Use your machine's LAN IP and ensure the device is on the same Wi-Fi network.
- **Build errors** — Run `cd android && ./gradlew clean` then retry `npm run android`.
- **General RN issues** — See the [React Native Troubleshooting](https://reactnative.dev/docs/troubleshooting) docs.
