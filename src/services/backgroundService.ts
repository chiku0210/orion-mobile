import BackgroundService from 'react-native-background-actions';
import notifee, { AndroidImportance } from '@notifee/react-native';
import { Platform } from 'react-native';

const sleep = (time: number) => new Promise((resolve) => setTimeout(resolve, time));

const options = {
    taskName: 'ORION',
    taskTitle: 'ORION — Ready',
    taskDesc: 'Push-to-Talk active',
    taskIcon: {
        name: 'ic_launcher',
        type: 'mipmap',
    },
    color: '#007AFF',
    linkingURI: 'orion://chat', // Required for Android 14+
    foregroundServiceType: ['microphone'], // Still needed if recording from background
    parameters: {
        delay: 1000,
    },
};

class OrionBackgroundService {
    private isRunning = false;

    async start() {
        if (this.isRunning) return;

        try {
            await this.initChannels();
            await BackgroundService.start(this.veryIntensiveTask, options);
            this.isRunning = true;
            console.log('[BackgroundService] Started');
        } catch (e) {
            console.error('[BackgroundService] Error starting service:', e);
        }
    }

    async stop() {
        await BackgroundService.stop();
        this.isRunning = false;
        console.log('[BackgroundService] Stopped');
    }

    private veryIntensiveTask = async (taskDataArguments: any) => {
        const { delay } = taskDataArguments;

        await new Promise(async () => {
            while (BackgroundService.isRunning()) {
                // Background keep-alive loop
                await sleep(delay);
            }
        });
    };


    // Initialize notification channels for Android
    async initChannels() {
        if (Platform.OS === 'android') {
            await notifee.createChannel({
                id: 'orion-listening',
                name: 'ORION Listening Channel',
                importance: AndroidImportance.HIGH,
            });
        }
    }
}

export const backgroundService = new OrionBackgroundService();
