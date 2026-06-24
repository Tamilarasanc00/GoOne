import Voice, { SpeechResultsEvent, SpeechErrorEvent } from '@react-native-voice/voice';
import Tts from 'react-native-tts';
import { navigate } from '../navigation/navigationRef';

type VoiceCallback = (text: string) => void;

class VoiceService {
  private isListening = false;
  private onResultCallback?: VoiceCallback;
  private onStateChangeCallback?: (isListening: boolean) => void;

  constructor() {
    Voice.onSpeechResults = this.onSpeechResults.bind(this);
    Voice.onSpeechError = this.onSpeechError.bind(this);
    Voice.onSpeechEnd = this.onSpeechEnd.bind(this);
    
    // Configure TTS
    Tts.setDefaultLanguage('en-IN');
    Tts.setDefaultRate(0.5);
  }

  public setCallbacks(onResult: VoiceCallback, onStateChange: (listening: boolean) => void) {
    this.onResultCallback = onResult;
    this.onStateChangeCallback = onStateChange;
  }

  public async startListening() {
    if (this.isListening) return;
    try {
      this.isListening = true;
      if (this.onStateChangeCallback) this.onStateChangeCallback(true);
      await Voice.start('en-IN');
    } catch (e) {
      console.error('Error starting voice:', e);
      this.isListening = false;
      if (this.onStateChangeCallback) this.onStateChangeCallback(false);
    }
  }

  public async stopListening() {
    try {
      await Voice.stop();
    } catch (e) {
      console.error(e);
    } finally {
      this.isListening = false;
      if (this.onStateChangeCallback) this.onStateChangeCallback(false);
    }
  }

  private onSpeechResults(e: SpeechResultsEvent) {
    if (e.value && e.value.length > 0) {
      const text = e.value[0].toLowerCase();
      this.stopListening();
      if (this.onResultCallback) {
        this.onResultCallback(text);
      }
      this.processCommand(text);
    }
  }

  private onSpeechError(e: SpeechErrorEvent) {
    console.error('Speech error', e);
    this.isListening = false;
    if (this.onStateChangeCallback) this.onStateChangeCallback(false);
    this.speak("Sorry, I didn't catch that.");
  }

  private onSpeechEnd() {
    this.isListening = false;
    if (this.onStateChangeCallback) this.onStateChangeCallback(false);
  }

  public speak(text: string) {
    Tts.speak(text);
  }

  public processCommand(command: string) {
    // Basic local keyword matching
    if (command.includes('profile')) {
      this.speak("Opening your profile");
      navigate('ProfileTab');
    } else if (command.includes('home')) {
      this.speak("Going home");
      navigate('HomeTab');
    } else if (command.includes('search') || command.includes('find')) {
      this.speak("Opening search");
      navigate('SearchTab');
    } else if (command.includes('map') || command.includes('explore')) {
      this.speak("Opening map");
      navigate('MapExploreTab');
    } else if (command.includes('shop') || command.includes('store')) {
      this.speak("Opening shops");
      navigate('RetailShopListing');
    } else if (command.includes('farmer') || command.includes('crop')) {
      this.speak("Opening farmers market");
      navigate('FarmerMarketplace');
    } else if (command.includes('worker') || command.includes('service')) {
      this.speak("Finding workers");
      navigate('ServiceWorkerListing');
    } else if (command.includes('job')) {
      this.speak("Finding jobs");
      navigate('DailyWageJobListing');
    } else if (command.includes('help') || command.includes('emergency')) {
      this.speak("Opening emergency help");
      navigate('NearbyHelp');
    } else if (command.includes('notification') || command.includes('alert')) {
      this.speak("Opening your alerts");
      navigate('NotificationsTab');
    } else {
      this.speak("I'm not sure how to do that yet.");
    }
  }
}

export const voiceService = new VoiceService();
