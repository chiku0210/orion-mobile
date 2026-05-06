import Tts from 'react-native-tts';

class TtsService {
  private isInitialized = false;

  async init() {
    if (this.isInitialized) {return;}

    try {
      await Tts.getInitStatus();
      this.isInitialized = true;
      Tts.setDefaultLanguage('en-IN');
      Tts.setDefaultRate(0.5); // ~1.0x rate in native terms
      Tts.setDefaultPitch(1.0);
    } catch (e: any) {
      if (e.code === 'no_engine') {
        Tts.requestInstallEngine();
      }
    }
  }

  speak(text: string) {
    if (!this.isInitialized) {
      console.warn('[TtsService] Not initialized');
      return;
    }
    Tts.stop();
    Tts.speak(text);
  }

  stop() {
    Tts.stop();
  }
}

export const ttsService = new TtsService();
