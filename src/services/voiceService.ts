import AudioRecorderPlayer, {
  AudioEncoderAndroidType,
  AudioSourceAndroidType,
} from 'react-native-audio-recorder-player';
import { Platform, PermissionsAndroid } from 'react-native';
import RNFS from 'react-native-fs';
import { messagesApi } from './api';
import { authStorage } from './storage';
import { useChatStore } from '../store/chatStore';

import { backgroundService } from './backgroundService';

class VoiceService {
  private audioRecorderPlayer: any; // Using any as a quick fix for the type vs value conflict in this specific library version
  private silenceTimer: NodeJS.Timeout | null = null;
  private absoluteTimer: NodeJS.Timeout | null = null;
  private isRecording = false;
  private readonly SILENCE_THRESHOLD = -30; // dB - less sensitive to prevent premature cutoff
  private readonly SILENCE_DURATION = 2500; // 2.5 seconds
  private readonly MAX_RECORDING_DURATION = 60000; // 60 seconds safety limit

  constructor() {
    this.audioRecorderPlayer = new (AudioRecorderPlayer as any)();
    this.audioRecorderPlayer.setSubscriptionDuration(0.1);
  }

  private async requestPermissions(): Promise<boolean> {
    if (Platform.OS === 'android') {
      try {
        const granted = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.RECORD_AUDIO,
          {
            title: 'Microphone Permission',
            message: 'ORION needs access to your microphone to record your voice.',
            buttonNeutral: 'Ask Me Later',
            buttonNegative: 'Cancel',
            buttonPositive: 'OK',
          }
        );
        return granted === PermissionsAndroid.RESULTS.GRANTED;
      } catch (err) {
        console.warn('[VoiceService] Permission request error:', err);
        return false;
      }
    }
    return true;
  }

  async startRecording() {
    if (this.isRecording) {return;}

    const hasPermission = await this.requestPermissions();
    if (!hasPermission) {
      console.error('[VoiceService] No recording permissions');
      return;
    }

    try {
      // Free up microphone if background service is holding it
      await backgroundService.stop();

      const fileName = 'orion_speech.m4a';
      const path = Platform.select({
        android: `${RNFS.CachesDirectoryPath}/${fileName}`,
        ios: `${RNFS.CachesDirectoryPath}/${fileName}`,
      });

      // Ensure directory exists
      const dir = Platform.OS === 'android' ? RNFS.CachesDirectoryPath : RNFS.CachesDirectoryPath;
      await RNFS.mkdir(dir!);

      const result = await this.audioRecorderPlayer.startRecorder(path, {
        AudioEncoderAndroid: AudioEncoderAndroidType.AAC,
        AudioSourceAndroid: AudioSourceAndroidType.MIC,
        AudioChannelsAndroid: 1,
        AudioSamplingRateAndroid: 44100,
        AVEncoderAudioQualityKeyIOS: 'high',
        AVNumberOfChannelsKeyIOS: 1,
        AVFormatIDKeyIOS: 'aac',
      });

      this.isRecording = true;
      useChatStore.getState().setIsRecording(true);
      console.log('[VoiceService] Recording started at:', result);

      // Set absolute safety timeout
      this.absoluteTimer = setTimeout(async () => {
        console.log('[VoiceService] Max duration reached, stopping...');
        const uri = await this.stopRecording();
        if (uri) {
          useChatStore.getState().setIsProcessingVoice(true);
          await this.processVoice(uri);
        }
      }, this.MAX_RECORDING_DURATION);

      this.audioRecorderPlayer.addRecordBackListener((e: any) => {
        // Log metering for debug to see if we're getting signal
        if (e.currentMetering !== undefined && Math.random() > 0.95) {
          console.log('[VoiceService] Metering (dB):', e.currentMetering);
        }

        if (e.currentMetering !== undefined && e.currentMetering < this.SILENCE_THRESHOLD) {
          this.startSilenceTimer();
        } else {
          this.clearSilenceTimer();
        }
        return;
      });
    } catch (e) {
      console.error('[VoiceService] Error starting recording:', e);
    }
  }

  async stopRecording() {
    if (!this.isRecording) {return;}

    try {
      const result = await this.audioRecorderPlayer.stopRecorder();
      this.audioRecorderPlayer.removeRecordBackListener();
      this.isRecording = false;
      useChatStore.getState().setIsRecording(false);
      this.clearSilenceTimer();
      
      if (this.absoluteTimer) {
        clearTimeout(this.absoluteTimer);
        this.absoluteTimer = null;
      }

      console.log('[VoiceService] Recording stopped, path:', result);
      
      // Restart background service for wake-word detection
      backgroundService.start().catch(e => console.error('[VoiceService] Background restart failed:', e));
      
      return result; // URI of the audio file
    } catch (e) {
      console.error('[VoiceService] Error stopping recording:', e);
      useChatStore.getState().setIsRecording(false);
      
      if (this.absoluteTimer) {
        clearTimeout(this.absoluteTimer);
        this.absoluteTimer = null;
      }
    }
  }

  public async handleManualStop() {
    const uri = await this.stopRecording();
    if (uri) {
      // Set processing immediately to avoid UI flicker back to mic icon
      useChatStore.getState().setIsProcessingVoice(true);
      await this.processVoice(uri);
    }
  }

  public async playLastRecording() {
    try {
      const fileName = 'orion_speech.m4a';
      const path = Platform.select({
        android: `${RNFS.CachesDirectoryPath}/${fileName}`,
        ios: `${RNFS.CachesDirectoryPath}/${fileName}`,
      });
      
      console.log('[VoiceService] Playing back:', path);
      await this.audioRecorderPlayer.startPlayer(path);
      this.audioRecorderPlayer.addPlayBackListener((e: any) => {
        if (e.currentPosition === e.duration) {
          this.audioRecorderPlayer.stopPlayer();
        }
      });
    } catch (e) {
      console.error('[VoiceService] Playback error:', e);
    }
  }

  public async stopPlayback() {
    await this.audioRecorderPlayer.stopPlayer();
    this.audioRecorderPlayer.removePlayBackListener();
  }

  private startSilenceTimer() {
    if (this.silenceTimer) {return;}

    this.silenceTimer = setTimeout(async () => {
      console.log('[VoiceService] VAD: Silence detected, stopping...');
      const uri = await this.stopRecording();
      if (uri) {
        useChatStore.getState().setIsProcessingVoice(true);
        this.processVoice(uri);
      }
    }, this.SILENCE_DURATION);
  }

  private clearSilenceTimer() {
    if (this.silenceTimer) {
      clearTimeout(this.silenceTimer);
      this.silenceTimer = null;
    }
  }

  private async processVoice(uri: string) {
    const token = await authStorage.getToken();
    if (!token) {return;}

    try {
      useChatStore.getState().setIsProcessingVoice(true);
      console.log('[VoiceService] Transcribing voice...');
      const response = await messagesApi.transcribe(token, uri);

      if (response.success && response.data?.text) {
        let text = response.data.text.trim();
        console.log('[VoiceService] Raw Transcript:', text);

        // Filter out common Whisper hallucinations for silent/noisy audio
        const hallucinations = [
          'Thank you.',
          'Thank you',
          'Thanks for watching.',
          'Thanks for watching',
          'Please subscribe.',
          'Watching for watching.',
        ];

        if (hallucinations.some(h => text.toLowerCase() === h.toLowerCase()) || text.length < 2) {
          console.warn('[VoiceService] Ignored likely hallucination/empty transcript:', text);
          return;
        }

        // Send to chat store and await it
        await useChatStore.getState().sendMessage(text, 'voice');
      }
    } catch (e) {
      console.error('[VoiceService] Error processing voice:', e);
    } finally {
      useChatStore.getState().setIsProcessingVoice(false);
    }
  }
}

export const voiceService = new VoiceService();
