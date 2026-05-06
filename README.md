# ORION Mobile

ORION is a voice-first personal AI assistant built with **React Native 0.76**. It features real-time streaming LLM interaction, on-device wake-word detection, and an intelligent background service.

---

## 🚀 Key v1.0 Features

### 1. Voice Interaction Loop
- **Wake Word:** On-device "Hey Orion" detection via **Picovoice Porcupine**.
- **Speech-to-Text:** Integration with **Groq Whisper** for high-accuracy transcription.
- **Text-to-Speech:** Native Android TTS for spoken AI responses.

### 2. Streaming UI (SSE)
- **Token Rendering:** Messages render progressively as they arrive via Server-Sent Events.
- **Performance:** Optimized for 60fps scrolling using **@shopify/flash-list**.

### 3. Persistent Background Service
- **Always Ready:** Uses an Android Foreground Service to maintain background wake-word detection, ensuring ORION is a "phone-in-pocket" daily driver.

---

## 🛠 Tech Stack

| Layer | Technology |
|---|---|
| Framework | React Native 0.76 (TypeScript) |
| Navigation | React Navigation v7 |
| State | Zustand v5 (Persisted) |
| UI | @shopify/flash-list |
| Voice | Porcupine + Whisper + Native TTS |
| Background | react-native-background-actions + Notifee |

---

## 📦 Project Structure

```
orion-mobile/
├── src/
│   ├── components/      # ChatBubble, InputBar, TypingIndicator
│   ├── screens/         # Chat, Login, Register, Settings
│   ├── services/        # api, background, storage, tts, voice, wakeWord
│   ├── store/           # authStore, chatStore, settingsStore
│   ├── types/           # TypeScript interfaces
│   └── utils/           # constants, colors, helpers
├── App.tsx              # Root Stack Navigator
├── index.js             # Entry Point
└── package.json
```

---

## 🚀 Getting Started

### 1. Configure Environment
Create a `.env` file in the root:
```env
API_BASE_URL=http://your-backend-ip:3000
PICOVOICE_ACCESS_KEY=your_key_here
```

### 2. Install & Run
```bash
npm install --legacy-peer-deps
npm start
npm run android
```

---

<h3 align="center">Part of the <a href="../README.md">ORION Ecosystem</a></h3>
