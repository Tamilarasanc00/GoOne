import Voice, { SpeechResultsEvent, SpeechErrorEvent } from '@react-native-voice/voice';
import Tts from 'react-native-tts';
import { navigate } from '../navigation/navigationRef';
import { storage, StorageKeys } from './storage';

type VoiceCallback = (text: string) => void;

// Tamil keywords mapped to English commands
const TAMIL_COMMANDS: Record<string, string> = {
  'கடை': 'shop', 'கடைகள்': 'shop', 'விற்பனை': 'shop',
  'விவசாயி': 'farmer', 'விவசாயம்': 'farmer', 'பயிர்': 'farmer',
  'தொழிலாளர்': 'worker', 'சேவை': 'worker', 'பணி': 'worker',
  'வேலை': 'job', 'வேலைகள்': 'job',
  'உதவி': 'help', 'அவசரம்': 'help', 'sos': 'help',
  'முகப்பு': 'home', 'வீடு': 'home',
  'அறிவிப்பு': 'notification', 'அறிவிப்புகள்': 'notification',
  'தேட': 'search', 'தேடல்': 'search',
  'சுயவிவரம்': 'profile', 'புரொஃபைல்': 'profile',
  'வரைபடம்': 'map', 'வாடகை': 'rental',
};

// Hindi keywords mapped to English commands
const HINDI_COMMANDS: Record<string, string> = {
  'दुकान': 'shop', 'दुकानें': 'shop', 'बाजार': 'shop',
  'किसान': 'farmer', 'फसल': 'farmer', 'खेत': 'farmer',
  'मजदूर': 'worker', 'सेवा': 'worker', 'काम': 'worker',
  'नौकरी': 'job', 'नौकरियां': 'job',
  'मदद': 'help', 'आपातकाल': 'help', 'sos': 'help',
  'होम': 'home', 'घर': 'home', 'मुखपृष्ठ': 'home',
  'अलर्ट': 'notification', 'सूचना': 'notification',
  'खोज': 'search', 'खोजें': 'search',
  'प्रोफाइल': 'profile', 'प्रोफ़ाइल': 'profile',
  'नक्शा': 'map', 'किराया': 'rental',
};

class VoiceService {
  private isListening = false;
  private onResultCallback?: VoiceCallback;
  private onStateChangeCallback?: (isListening: boolean) => void;
  private retryCount = 0;
  private maxRetries = 1;

  constructor() {
    this.initListeners();
    // Configure TTS
    Tts.setDefaultLanguage('hi-IN');
    Tts.setDefaultRate(0.5);
  }

  private initListeners() {
    Voice.onSpeechResults = this.onSpeechResults.bind(this);
    Voice.onSpeechError = this.onSpeechError.bind(this);
    Voice.onSpeechEnd = this.onSpeechEnd.bind(this);
  }

  public setCallbacks(onResult: VoiceCallback, onStateChange: (listening: boolean) => void) {
    this.onResultCallback = onResult;
    this.onStateChangeCallback = onStateChange;
  }

  private getLanguageCode(): string {
    const lang = storage.getString(StorageKeys.LANGUAGE) || 'hi';
    const codes: Record<string, string> = {
      ta: 'ta-IN', hi: 'hi-IN', te: 'te-IN',
      kn: 'kn-IN', ml: 'ml-IN', en: 'en-IN',
    };
    return codes[lang] || 'hi-IN';
  }

  private getTtsLanguageCode(): string {
    return this.getLanguageCode();
  }

  public async startListening() {
    if (this.isListening) return;
    try {
      this.isListening = true;
      this.retryCount = 0;
      if (this.onStateChangeCallback) this.onStateChangeCallback(true);
      await Voice.start(this.getLanguageCode());
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

  // Call on screen unmount to prevent memory leaks
  public async destroy() {
    try {
      await Voice.destroy();
      Voice.removeAllListeners();
    } catch (e) {
      console.error('Error destroying voice:', e);
    }
    this.isListening = false;
    this.onResultCallback = undefined;
    this.onStateChangeCallback = undefined;
  }

  private normalizeCommand(rawText: string): string {
    const lower = rawText.toLowerCase().trim();
    // Check Tamil keywords
    for (const [taWord, enCmd] of Object.entries(TAMIL_COMMANDS)) {
      if (lower.includes(taWord)) return enCmd;
    }
    // Check Hindi keywords
    for (const [hiWord, enCmd] of Object.entries(HINDI_COMMANDS)) {
      if (lower.includes(hiWord)) return enCmd;
    }
    return lower; // return original for English matching
  }

  private onSpeechResults(e: SpeechResultsEvent) {
    if (e.value && e.value.length > 0) {
      const rawText = e.value[0];
      const normalized = this.normalizeCommand(rawText);
      this.stopListening();
      if (this.onResultCallback) {
        this.onResultCallback(rawText); // return original for display
      }
      this.processCommand(normalized);
    }
  }

  private onSpeechError(e: SpeechErrorEvent) {
    console.error('Speech error', e);
    // Retry once before giving up
    if (this.retryCount < this.maxRetries) {
      this.retryCount++;
      setTimeout(() => {
        if (!this.isListening) this.startListening();
      }, 500);
    } else {
      this.isListening = false;
      if (this.onStateChangeCallback) this.onStateChangeCallback(false);
      this.speak(this.getErrorMessage());
    }
  }

  private onSpeechEnd() {
    this.isListening = false;
    if (this.onStateChangeCallback) this.onStateChangeCallback(false);
  }

  private getErrorMessage(): string {
    const lang = storage.getString(StorageKeys.LANGUAGE) || 'hi';
    if (lang === 'ta') return 'மன்னிக்கவும், புரியவில்லை.';
    if (lang === 'hi') return 'माफ करें, समझ नहीं आया।';
    return "Sorry, I didn't catch that.";
  }

  public speak(text: string) {
    const ttsLang = this.getTtsLanguageCode();
    Tts.setDefaultLanguage(ttsLang)
      .then(() => Tts.speak(text))
      .catch(() => {
        Tts.setDefaultLanguage('en-IN').then(() => Tts.speak(text));
      });
  }

  public processCommand(command: string) {
    const lang = storage.getString(StorageKeys.LANGUAGE) || 'hi';

    const responses: Record<string, { text: { ta: string; hi: string; en: string }; route: string }> = {
      profile: { text: { ta: 'உங்கள் சுயவிவரம் திறக்கிறது', hi: 'प्रोफ़ाइल खुल रहा है', en: 'Opening your profile' }, route: 'ProfileTab' },
      home: { text: { ta: 'முகப்பு திறக்கிறது', hi: 'होम खुल रहा है', en: 'Going home' }, route: 'HomeTab' },
      search: { text: { ta: 'தேடல் திறக்கிறது', hi: 'खोज खुल रही है', en: 'Opening search' }, route: 'SearchTab' },
      map: { text: { ta: 'வரைபடம் திறக்கிறது', hi: 'नक्शा खुल रहा है', en: 'Opening map' }, route: 'MapExploreTab' },
      shop: { text: { ta: 'கடைகள் திறக்கிறது', hi: 'दुकानें खुल रही हैं', en: 'Opening shops' }, route: 'RetailShopListing' },
      farmer: { text: { ta: 'விவசாயிகள் திறக்கிறது', hi: 'किसान बाज़ार खुल रहा है', en: 'Opening farmer market' }, route: 'FarmerMarketplace' },
      worker: { text: { ta: 'தொழிலாளர்கள் திறக்கிறது', hi: 'श्रमिक खोज रहे हैं', en: 'Finding workers' }, route: 'ServiceWorkerListing' },
      job: { text: { ta: 'வேலைகள் திறக்கிறது', hi: 'नौकरियां खोज रहे हैं', en: 'Finding jobs' }, route: 'DailyWageJobListing' },
      help: { text: { ta: 'அவசர உதவி திறக்கிறது', hi: 'आपातकालीन सहायता खुल रही है', en: 'Opening emergency help' }, route: 'NearbyHelp' },
      notification: { text: { ta: 'அறிவிப்புகள் திறக்கிறது', hi: 'अलर्ट खुल रहे हैं', en: 'Opening alerts' }, route: 'NotificationsTab' },
      rental: { text: { ta: 'வாடகை திறக்கிறது', hi: 'किराया खुल रहा है', en: 'Opening rentals' }, route: 'RentalMarketplace' },
    };

    for (const [key, data] of Object.entries(responses)) {
      if (command.includes(key)) {
        const responseText = data.text[lang as 'ta' | 'hi' | 'en'] || data.text.en;
        this.speak(responseText);
        navigate(data.route);
        return;
      }
    }

    this.speak(this.getErrorMessage());
  }
}

export const voiceService = new VoiceService();
