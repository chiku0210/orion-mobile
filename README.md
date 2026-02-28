# ORION Mobile

**Android voice assistant** with wake word detection, voice/text chat, and AI-powered responses. Built for portfolio showcase and real-world deployment.

## Stack

- **Frontend**: React Native 0.76+ (Android only)
- **Wake Word**: Picovoice Porcupine ("Hey ORION")
- **Voice**: react-native-tts (Indian English, male voice 0.9x)
- **State**: Redux Toolkit + RTK Query
- **Backend**: Node/Express + PostgreSQL ([my-pet-bot](https://github.com/chiku0210/my-pet-bot))
- **APIs**: Groq (Whisper STT, Llama3 70B)

## Features

- Background wake word activation
- Voice + text chat modes
- Local message caching (AsyncStorage)
- Clean chat UI with history
- JWT authentication
- User settings persistence

## Setup

```bash
# Install dependencies
npm install

# Run on Android device/emulator
npm run android
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
├── components/     # Reusable UI components
├── screens/        # App screens (Chat, Settings, History)
├── store/          # Redux slices + RTK Query API
├── services/       # Wake word, TTS, API client
├── utils/          # Helpers and constants
└── navigation/     # React Navigation setup
```

## Related Repos

- Backend API: [my-pet-bot](https://github.com/chiku0210/my-pet-bot)
- Web Dashboard: [orion-frontend](https://github.com/chiku0210/orion-frontend)

## License

MIT — Built by [Nielless Acharya](https://github.com/chiku0210)
