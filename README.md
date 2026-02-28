# ORION Mobile

**ORION AI Voice Assistant** — React Native Android app with wake word detection, voice/text chat, and LLM-powered responses.

## Stack

- **Frontend**: React Native 0.76+
- **Wake Word**: Picovoice Porcupine ("Hey ORION")
- **Voice**: react-native-tts (Indian English, male voice)
- **State**: Redux Toolkit + RTK Query
- **Backend**: Node/Express API ([orion-backend](https://github.com/chiku0210/my-pet-bot))
- **APIs**: Groq (Whisper for STT, Llama3 70B for chat)

## Features

- Wake word activation in background
- Voice + text chat modes
- Local message persistence (AsyncStorage)
- Clean UI with chat history
- Auth (JWT) + user settings

## Setup

```bash
# Install dependencies
npm install

# iOS pods (macOS only)
cd ios && pod install && cd ..

# Run Android
npm run android

# Run iOS
npm run ios
```

## Environment

Create `.env`:

```env
API_BASE_URL=https://your-backend.com/api
PICOVOICE_ACCESS_KEY=your_key_here
```

## Project Structure

```
src/
├── components/     # UI components
├── screens/        # App screens
├── store/          # Redux slices + RTK Query
├── services/       # API client, wake word, TTS
├── utils/          # Helpers
└── navigation/     # React Navigation
```

## Related Repos

- Backend: [my-pet-bot](https://github.com/chiku0210/my-pet-bot)
- Frontend Web: [orion-frontend](https://github.com/chiku0210/orion-frontend)

## License

MIT — Built by [Nielless Acharya](https://github.com/chiku0210)
