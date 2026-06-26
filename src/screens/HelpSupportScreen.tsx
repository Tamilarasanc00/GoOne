import React, { useState, useRef, useEffect } from 'react';
import {
  View, StyleSheet, ScrollView, TouchableOpacity,
  TextInput, StatusBar, KeyboardAvoidingView, Platform, Keyboard,
} from 'react-native';
import { Text } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';
import Colors from '../constants/colors';
import { Radius, Spacing } from '../constants/spacing';
import { voiceService } from '../services/voiceService';
import { storage, StorageKeys } from '../services/storage';

// ─── AI Knowledge Base ────────────────────────────────────────────────────────
type LangKey = 'ta' | 'hi' | 'en';
interface KBEntry {
  keywords: string[];
  answer: Record<LangKey, string>;
  action?: { label: Record<LangKey, string>; route: string };
}

const KNOWLEDGE_BASE: KBEntry[] = [
  {
    keywords: ['product', 'தயாரிப்பு', 'उत्पाद', 'add product', 'add item', 'புது பொருள்'],
    answer: {
      en: '📦 To add a product:\n1. Go to your Dashboard\n2. Tap "Add Product" button\n3. Fill in name, price, quantity\n4. Add a photo\n5. Tap Save\n\nProducts will appear in your shop listing instantly.',
      hi: '📦 उत्पाद जोड़ने के लिए:\n1. अपने डैशबोर्ड पर जाएं\n2. "उत्पाद जोड़ें" बटन दबाएं\n3. नाम, मूल्य, मात्रा भरें\n4. फोटो जोड़ें\n5. सहेजें दबाएं',
      ta: '📦 தயாரிப்பு சேர்க்க:\n1. உங்கள் டாஷ்போர்டிற்கு செல்லுங்கள்\n2. "தயாரிப்பு சேர்" பொத்தானை அழுத்துங்கள்\n3. பெயர், விலை, அளவு நிரப்புங்கள்\n4. படம் சேருங்கள்\n5. சேமி அழுத்துங்கள்',
    },
    action: { label: { en: 'Go to Dashboard', hi: 'डैशबोर्ड जाएं', ta: 'டாஷ்போர்டு செல்' }, route: 'MainTabs' },
  },
  {
    keywords: ['order', 'booking', 'ऑर्डर', 'बुकिंग', 'ஆர்டர்', 'பதிவு'],
    answer: {
      en: '📋 To view your orders and bookings:\n1. Tap the "Bookings" tab at the bottom\n2. You can see all pending and completed orders\n3. Tap any order to see details',
      hi: '📋 अपने ऑर्डर देखने के लिए:\n1. नीचे "बुकिंग" टैब दबाएं\n2. सभी लंबित और पूर्ण ऑर्डर देखें\n3. विवरण के लिए किसी ऑर्डर पर टैप करें',
      ta: '📋 உங்கள் ஆர்டர்களை பார்க்க:\n1. கீழே "பதிவுகள்" தாவலை தொடுங்கள்\n2. அனைத்து நிலுவை மற்றும் முடிந்த ஆர்டர்களை பாருங்கள்',
    },
    action: { label: { en: 'View Bookings', hi: 'बुकिंग देखें', ta: 'பதிவுகள் காண்' }, route: 'BookingsTab' },
  },
  {
    keywords: ['profile', 'edit profile', 'प्रोफाइल', 'प्रोफ़ाइल', 'சுயவிவரம்', 'name', 'photo'],
    answer: {
      en: '✏️ To edit your profile:\n1. Tap "Profile" tab at the bottom\n2. Tap "Edit Profile" button\n3. Update your name, location, photo\n4. Tap Save\n\nYour location helps customers find you nearby.',
      hi: '✏️ प्रोफ़ाइल संपादित करने के लिए:\n1. नीचे "प्रोफ़ाइल" टैब दबाएं\n2. "प्रोफ़ाइल संपादित करें" दबाएं\n3. नाम, स्थान, फोटो अपडेट करें\n4. सहेजें दबाएं',
      ta: '✏️ சுயவிவரம் திருத்த:\n1. கீழே "சுயவிவரம்" தாவலை தொடுங்கள்\n2. "சுயவிவரம் திருத்து" அழுத்துங்கள்\n3. பெயர், இடம், படம் புதுப்பிக்கவும்\n4. சேமி அழுத்துங்கள்',
    },
    action: { label: { en: 'Edit Profile', hi: 'प्रोफ़ाइल संपादित करें', ta: 'சுயவிவரம் திருத்து' }, route: 'CreateProfile' },
  },
  {
    keywords: ['location', 'gps', 'address', 'स्थान', 'पता', 'இருப்பிடம்', 'address', 'lat', 'lng'],
    answer: {
      en: '📍 To set your location:\n1. Go to Edit Profile\n2. In the Location section, tap "📍 Auto-detect GPS"\n3. Or type your village/town name\n4. Or enter Latitude and Longitude manually\n5. Save your profile\n\nAccurate location helps customers find you!',
      hi: '📍 स्थान सेट करने के लिए:\n1. प्रोफ़ाइल संपादित करें पर जाएं\n2. स्थान अनुभाग में "📍 GPS से पता लगाएं" दबाएं\n3. या गांव/शहर का नाम टाइप करें\n4. सहेजें',
      ta: '📍 இருப்பிடம் அமைக்க:\n1. சுயவிவரம் திருத்துக்கு செல்லுங்கள்\n2. "📍 GPS தானாக கண்டுபிடி" அழுத்துங்கள்\n3. அல்லது கிராமம்/நகரம் பெயர் தட்டச்சு செய்யுங்கள்',
    },
    action: { label: { en: 'Edit Profile', hi: 'प्रोफ़ाइल संपादित करें', ta: 'சுயவிவரம் திருத்து' }, route: 'CreateProfile' },
  },
  {
    keywords: ['notification', 'alert', 'अलर्ट', 'सूचना', 'அறிவிப்பு'],
    answer: {
      en: '🔔 To see your notifications:\n1. Tap the 🔔 bell icon on your dashboard\n2. Or tap "Alerts" in the bottom tab\n3. Tap any notification to mark as read\n4. Tap "Mark all read" to clear all',
      hi: '🔔 अलर्ट देखने के लिए:\n1. डैशबोर्ड पर 🔔 बेल आइकन दबाएं\n2. या नीचे "अलर्ट" टैब दबाएं',
      ta: '🔔 அறிவிப்புகளை பார்க்க:\n1. டாஷ்போர்டில் 🔔 மணி ஐகானை தொடுங்கள்\n2. அல்லது கீழே "அறிவிப்புகள்" தாவலை தொடுங்கள்',
    },
    action: { label: { en: 'View Notifications', hi: 'अलर्ट देखें', ta: 'அறிவிப்புகள் காண்' }, route: 'Notifications' },
  },
  {
    keywords: ['shop', 'retailer', 'दुकान', 'கடை', 'retail', 'store'],
    answer: {
      en: '🏪 To find shops near you:\n1. From Home screen, tap "Shops"\n2. Browse by category: Groceries, Hardware, Clothing, etc.\n3. Tap any shop to view products\n4. Call or WhatsApp the shop directly',
      hi: '🏪 पास की दुकानें खोजने के लिए:\n1. होम से "दुकानें" दबाएं\n2. श्रेणी से ब्राउज़ करें\n3. किसी दुकान पर टैप करें\n4. सीधे कॉल या व्हाट्सएप करें',
      ta: '🏪 அருகில் கடைகள் தேட:\n1. முகப்பிலிருந்து "கடைகள்" அழுத்துங்கள்\n2. வகையால் பார்க்கவும்\n3. எந்த கடையிலும் தொடுங்கள்',
    },
    action: { label: { en: 'Browse Shops', hi: 'दुकानें देखें', ta: 'கடைகள் பார்' }, route: 'RetailShopListing' },
  },
  {
    keywords: ['farmer', 'crop', 'किसान', 'फसल', 'விவசாயி', 'பயிர்', 'vegetable', 'fruit'],
    answer: {
      en: '🌾 To find farmers and fresh produce:\n1. From Home screen, tap "Farmers"\n2. Browse vegetables, fruits, grains\n3. Contact farmers directly\n4. Check today\'s market rates on the Farmer Dashboard',
      hi: '🌾 किसान और ताजे उत्पाद खोजने के लिए:\n1. होम से "किसान" दबाएं\n2. सब्जियां, फल, अनाज देखें\n3. किसानों से सीधे संपर्क करें',
      ta: '🌾 விவசாயிகள் மற்றும் விளைபொருள் தேட:\n1. முகப்பிலிருந்து "விவசாயிகள்" அழுத்துங்கள்\n2. காய்கறிகள், பழங்கள், தானியங்கள் பாருங்கள்',
    },
    action: { label: { en: 'Browse Farmers', hi: 'किसान देखें', ta: 'விவசாயிகள் பார்' }, route: 'FarmerMarketplace' },
  },
  {
    keywords: ['worker', 'service', 'electrician', 'plumber', 'carpenter', 'श्रमिक', 'सेवा', 'बिजली', 'தொழிலாளர்', 'சேவை', 'மின்சாரம்'],
    answer: {
      en: '🔧 To find service workers:\n1. From Home, tap "Services"\n2. Choose category: Electrician, Plumber, etc.\n3. View available workers\n4. Book directly or call them',
      hi: '🔧 सेवा श्रमिक खोजने के लिए:\n1. होम से "सेवाएं" दबाएं\n2. श्रेणी चुनें: बिजली मिस्त्री, प्लंबर आदि\n3. उपलब्ध श्रमिक देखें\n4. सीधे बुक करें या कॉल करें',
      ta: '🔧 தொழிலாளர்கள் தேட:\n1. முகப்பிலிருந்து "சேவைகள்" அழுத்துங்கள்\n2. வகை தேர்ந்தெடுங்கள்\n3. கிடைக்கும் தொழிலாளர்களை பாருங்கள்',
    },
    action: { label: { en: 'Find Workers', hi: 'श्रमिक खोजें', ta: 'தொழிலாளர்கள் தேட்' }, route: 'ServiceWorkerListing' },
  },
  {
    keywords: ['rental', 'tractor', 'machine', 'equipment', 'किराया', 'ट्रैक्टर', 'வாடகை', 'டிராக்டர்'],
    answer: {
      en: '🚜 To rent equipment:\n1. From Home, tap "Rentals"\n2. Browse tractors, tools, vehicles\n3. Contact the owner for availability\n4. Book and pay directly',
      hi: '🚜 उपकरण किराए पर लेने के लिए:\n1. होम से "किराए पर" दबाएं\n2. ट्रैक्टर, उपकरण, वाहन देखें\n3. उपलब्धता के लिए मालिक से संपर्क करें',
      ta: '🚜 உபகரணங்கள் வாடகைக்கு:\n1. முகப்பிலிருந்து "வாடகைகள்" அழுத்துங்கள்\n2. டிராக்டர், கருவிகள் பாருங்கள்',
    },
    action: { label: { en: 'Browse Rentals', hi: 'किराया देखें', ta: 'வாடகைகள் பார்' }, route: 'RentalMarketplace' },
  },
  {
    keywords: ['job', 'work', 'daily wage', 'नौकरी', 'काम', 'वेतन', 'வேலை', 'தினசரி'],
    answer: {
      en: '👷 To find daily wage jobs:\n1. From Home, tap "Jobs"\n2. Browse available jobs by category\n3. Apply with one tap\n4. Employer will contact you',
      hi: '👷 दैनिक मजदूरी नौकरी खोजने के लिए:\n1. होम से "नौकरियां" दबाएं\n2. श्रेणी के अनुसार नौकरियां देखें\n3. एक टैप से आवेदन करें',
      ta: '👷 தினசரி வேலைகள் தேட:\n1. முகப்பிலிருந்து "வேலைகள்" அழுத்துங்கள்\n2. வகையால் வேலைகள் பாருங்கள்\n3. ஒரு தொடுதலில் விண்ணப்பிக்கவும்',
    },
    action: { label: { en: 'Browse Jobs', hi: 'नौकरियां देखें', ta: 'வேலைகள் பார்' }, route: 'DailyWageJobListing' },
  },
  {
    keywords: ['sos', 'emergency', 'help', 'danger', 'accident', 'आपातकाल', 'खतरा', 'அவசரம்', 'ஆபத்து'],
    answer: {
      en: '🆘 For emergency help:\n1. Tap "SOS Help" on the Home screen\n2. Your location will be shared with nearby helpers\n3. You can also send voice message about the emergency\n\n⚠️ Please use only for genuine emergencies',
      hi: '🆘 आपातकालीन सहायता के लिए:\n1. होम पर "SOS Help" दबाएं\n2. आपका स्थान नजदीकी सहायकों के साथ साझा होगा\n\n⚠️ केवल वास्तविक आपात स्थितियों में उपयोग करें',
      ta: '🆘 அவசர உதவிக்கு:\n1. முகப்பில் "SOS Help" அழுத்துங்கள்\n2. உங்கள் இருப்பிடம் அருகில் உள்ளவர்களுடன் பகிரப்படும்\n\n⚠️ உண்மையான அவசரங்களில் மட்டுமே பயன்படுத்துங்கள்',
    },
    action: { label: { en: 'SOS Help', hi: 'आपातकाल', ta: 'அவசர உதவி' }, route: 'NearbyHelp' },
  },
  {
    keywords: ['language', 'மொழி', 'भाषा', 'change language', 'hindi', 'tamil', 'english'],
    answer: {
      en: '🌐 To change the language:\n1. Go to Settings (Profile tab → Settings)\n2. Tap "Change Language"\n3. Select your preferred language\n4. The app will immediately switch\n\nSupported: Hindi, English, Tamil, Telugu, Kannada, Malayalam',
      hi: '🌐 भाषा बदलने के लिए:\n1. सेटिंग्स पर जाएं (प्रोफ़ाइल → सेटिंग्स)\n2. "भाषा बदलें" दबाएं\n3. अपनी पसंदीदा भाषा चुनें',
      ta: '🌐 மொழி மாற்ற:\n1. அமைப்புகளுக்கு செல்லுங்கள்\n2. "மொழியை மாற்று" அழுத்துங்கள்\n3. விரும்பிய மொழி தேர்வு செய்யுங்கள்',
    },
    action: { label: { en: 'Change Language', hi: 'भाषा बदलें', ta: 'மொழி மாற்று' }, route: 'LanguageSelection' },
  },
  {
    keywords: ['payment', 'subscription', 'plan', 'भुगतान', 'सदस्यता', 'கட்டணம்', 'சந்தா'],
    answer: {
      en: '💳 For subscription and payments:\n1. Go to Profile tab\n2. Tap "Subscription"\n3. Choose a plan (Basic/Premium)\n4. Complete payment via UPI or card\n\nBasic plan is free for all users.',
      hi: '💳 सदस्यता और भुगतान के लिए:\n1. प्रोफ़ाइल टैब पर जाएं\n2. "सदस्यता" दबाएं\n3. योजना चुनें (बेसिक/प्रीमियम)',
      ta: '💳 சந்தா மற்றும் கட்டணங்களுக்கு:\n1. சுயவிவரம் தாவலுக்கு செல்லுங்கள்\n2. "சந்தா" அழுத்துங்கள்\n3. திட்டம் தேர்வு செய்யுங்கள்',
    },
  },
];

function getAIResponse(question: string, lang: LangKey): { answer: string; action?: KBEntry['action'] } {
  const q = question.toLowerCase();
  for (const entry of KNOWLEDGE_BASE) {
    if (entry.keywords.some(kw => q.includes(kw.toLowerCase()))) {
      return { answer: entry.answer[lang] || entry.answer.en, action: entry.action };
    }
  }
  return {
    answer: lang === 'ta'
      ? 'மன்னிக்கவும், இந்த கேள்விக்கு பதில் தெரியவில்லை. கீழே உள்ள விரைவு பொத்தான்களை முயற்சிக்கவும் அல்லது வேறு வகையில் கேளுங்கள்.'
      : lang === 'hi'
      ? 'माफ करें, इस प्रश्न का उत्तर नहीं मिला। नीचे दिए क्विक बटन आज़माएं या अलग तरह से पूछें।'
      : "Sorry, I don't have an answer for that. Try the quick buttons below or ask differently.",
  };
}

interface ChatMessage {
  id: string;
  text: string;
  isBot: boolean;
  action?: KBEntry['action'];
  timestamp: Date;
}

const QUICK_FAQS = [
  { key: 'add_product', icons: { ta: '📦 தயாரிப்பு சேர்', hi: '📦 उत्पाद जोड़ें', en: '📦 Add Product' }, q: 'how to add product' },
  { key: 'view_orders', icons: { ta: '📋 ஆர்டர்கள்', hi: '📋 ऑर्डर देखें', en: '📋 View Orders' }, q: 'how to view orders' },
  { key: 'edit_profile', icons: { ta: '✏️ சுயவிவரம்', hi: '✏️ प्रोफ़ाइल', en: '✏️ Edit Profile' }, q: 'how to edit profile' },
  { key: 'location', icons: { ta: '📍 இருப்பிடம்', hi: '📍 स्थान', en: '📍 Set Location' }, q: 'how to set location' },
  { key: 'sos', icons: { ta: '🆘 உதவி', hi: '🆘 मदद', en: '🆘 SOS Help' }, q: 'emergency help sos' },
  { key: 'language', icons: { ta: '🌐 மொழி', hi: '🌐 भाषा', en: '🌐 Language' }, q: 'how to change language' },
];

export default function HelpSupportScreen() {
  const { t } = useTranslation();
  const navigation = useNavigation<any>();
  const scrollRef = useRef<ScrollView>(null);
  const lang = (storage.getString(StorageKeys.LANGUAGE) || 'hi') as LangKey;

  const greeting = t('help.greeting');

  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: '0',
      text: greeting,
      isBot: true,
      timestamp: new Date(),
    },
  ]);
  const [inputText, setInputText] = useState('');
  const [isTyping, setIsTyping] = useState(false);

  useEffect(() => {
    setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 100);
  }, [messages]);

  const sendMessage = (text: string) => {
    if (!text.trim()) return;
    Keyboard.dismiss();
    const userMsg: ChatMessage = {
      id: Date.now().toString(),
      text: text.trim(),
      isBot: false,
      timestamp: new Date(),
    };
    setMessages(prev => [...prev, userMsg]);
    setInputText('');
    setIsTyping(true);

    // Simulate thinking delay for more natural feel
    setTimeout(() => {
      const { answer, action } = getAIResponse(text, lang);
      const botMsg: ChatMessage = {
        id: (Date.now() + 1).toString(),
        text: answer,
        isBot: true,
        action,
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, botMsg]);
      setIsTyping(false);
      // Speak the answer
      voiceService.speak(answer.length > 120 ? answer.substring(0, 120) + '...' : answer);
    }, 800);
  };

  const handleFAQ = (faq: typeof QUICK_FAQS[0]) => {
    const label = faq.icons[lang] || faq.icons.en;
    sendMessage(faq.q);
  };

  const handleActionPress = (action: KBEntry['action']) => {
    if (!action) return;
    navigation.navigate(action.route as any);
  };

  const renderMessage = (msg: ChatMessage) => (
    <View key={msg.id} style={[styles.messageRow, msg.isBot ? styles.botRow : styles.userRow]}>
      {msg.isBot && (
        <View style={styles.avatarBubble}>
          <Text style={styles.avatarEmoji}>🤖</Text>
        </View>
      )}
      <View style={[styles.bubble, msg.isBot ? styles.botBubble : styles.userBubble]}>
        <Text style={[styles.bubbleText, msg.isBot ? styles.botText : styles.userText]}>
          {msg.text}
        </Text>
        {msg.isBot && msg.action && (
          <TouchableOpacity
            style={styles.actionBtn}
            onPress={() => handleActionPress(msg.action)}
            activeOpacity={0.8}
          >
            <Text style={styles.actionBtnTxt}>
              {msg.action.label[lang] || msg.action.label.en} →
            </Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'left', 'right']}>
      <StatusBar barStyle="light-content" backgroundColor={Colors.bluePrimary} />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Text style={styles.backTxt}>←</Text>
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>{t('help.title')}</Text>
          <Text style={styles.headerSub}>GoOne AI Assistant 🤖</Text>
        </View>
        <View style={styles.botAvatar}>
          <Text style={{ fontSize: 22 }}>🤖</Text>
        </View>
      </View>

      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={0}
      >
        {/* Chat messages */}
        <ScrollView
          ref={scrollRef}
          style={styles.chatArea}
          contentContainerStyle={styles.chatContent}
          showsVerticalScrollIndicator={false}
        >
          {messages.map(renderMessage)}

          {isTyping && (
            <View style={[styles.messageRow, styles.botRow]}>
              <View style={styles.avatarBubble}>
                <Text style={styles.avatarEmoji}>🤖</Text>
              </View>
              <View style={[styles.bubble, styles.botBubble, styles.typingBubble]}>
                <Text style={styles.typingDots}>● ● ●</Text>
              </View>
            </View>
          )}
        </ScrollView>

        {/* Quick FAQ chips */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.faqScroll}
          contentContainerStyle={styles.faqContent}
        >
          {QUICK_FAQS.map(faq => (
            <TouchableOpacity
              key={faq.key}
              style={styles.faqChip}
              onPress={() => handleFAQ(faq)}
              activeOpacity={0.7}
            >
              <Text style={styles.faqChipTxt}>{faq.icons[lang] || faq.icons.en}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Input bar */}
        <View style={styles.inputBar}>
          <TouchableOpacity
            style={styles.voiceBtn}
            onPress={() => voiceService.startListening()}
            activeOpacity={0.7}
          >
            <Text style={{ fontSize: 20 }}>🎙️</Text>
          </TouchableOpacity>
          <TextInput
            style={styles.textInput}
            placeholder={t('help.askQuestion')}
            placeholderTextColor={Colors.textMuted}
            value={inputText}
            onChangeText={setInputText}
            multiline={false}
            returnKeyType="send"
            onSubmitEditing={() => sendMessage(inputText)}
          />
          <TouchableOpacity
            style={[styles.sendBtn, !inputText.trim() && styles.sendBtnDisabled]}
            onPress={() => sendMessage(inputText)}
            activeOpacity={0.8}
            disabled={!inputText.trim()}
          >
            <Text style={styles.sendTxt}>➤</Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.bgLight },
  flex: { flex: 1 },

  header: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: Colors.bluePrimary,
    paddingHorizontal: Spacing.md, paddingVertical: 14,
    gap: 10,
  },
  backBtn: {
    width: 38, height: 38, borderRadius: 19,
    backgroundColor: 'rgba(255,255,255,0.18)',
    alignItems: 'center', justifyContent: 'center',
  },
  backTxt: { fontSize: 22, color: Colors.white, fontWeight: '700' },
  headerCenter: { flex: 1 },
  headerTitle: { fontSize: 18, fontWeight: '800', color: Colors.white },
  headerSub: { fontSize: 11, color: 'rgba(255,255,255,0.8)', marginTop: 1 },
  botAvatar: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center', justifyContent: 'center',
  },

  chatArea: { flex: 1 },
  chatContent: { padding: Spacing.md, paddingBottom: Spacing.lg, gap: 12 },

  messageRow: { flexDirection: 'row', alignItems: 'flex-end', gap: 8 },
  botRow: { justifyContent: 'flex-start' },
  userRow: { justifyContent: 'flex-end' },

  avatarBubble: {
    width: 32, height: 32, borderRadius: 16,
    backgroundColor: Colors.blueSoft,
    alignItems: 'center', justifyContent: 'center',
    marginBottom: 2,
  },
  avatarEmoji: { fontSize: 16 },

  bubble: {
    maxWidth: '78%', borderRadius: Radius.lg,
    paddingHorizontal: 14, paddingVertical: 10,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08, shadowRadius: 4, elevation: 2,
  },
  botBubble: {
    backgroundColor: Colors.white,
    borderBottomLeftRadius: 4,
  },
  userBubble: {
    backgroundColor: Colors.bluePrimary,
    borderBottomRightRadius: 4,
  },
  typingBubble: { paddingVertical: 14 },

  bubbleText: { fontSize: 14, lineHeight: 22 },
  botText: { color: Colors.textPrimary },
  userText: { color: Colors.white },
  typingDots: { color: Colors.textMuted, fontSize: 12, letterSpacing: 4 },

  actionBtn: {
    marginTop: 10,
    backgroundColor: Colors.bluePrimary,
    borderRadius: Radius.full,
    paddingHorizontal: 14, paddingVertical: 7,
    alignSelf: 'flex-start',
  },
  actionBtnTxt: { color: Colors.white, fontSize: 12, fontWeight: '700' },

  faqScroll: { maxHeight: 50 },
  faqContent: { paddingHorizontal: Spacing.md, gap: 8, alignItems: 'center', paddingVertical: 6 },
  faqChip: {
    backgroundColor: Colors.white,
    borderRadius: Radius.full,
    paddingHorizontal: 14, paddingVertical: 7,
    borderWidth: 1, borderColor: Colors.border,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06, shadowRadius: 3, elevation: 1,
  },
  faqChipTxt: { fontSize: 13, fontWeight: '600', color: Colors.textPrimary },

  inputBar: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: Colors.white,
    paddingHorizontal: Spacing.md, paddingVertical: 10,
    borderTopWidth: 1, borderTopColor: Colors.border,
    gap: 8,
  },
  voiceBtn: {
    width: 42, height: 42, borderRadius: 21,
    backgroundColor: Colors.bgLight,
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 1, borderColor: Colors.border,
  },
  textInput: {
    flex: 1, height: 42,
    backgroundColor: Colors.bgLight,
    borderRadius: Radius.full,
    paddingHorizontal: 14,
    fontSize: 14, color: Colors.textPrimary,
    borderWidth: 1, borderColor: Colors.border,
  },
  sendBtn: {
    width: 42, height: 42, borderRadius: 21,
    backgroundColor: Colors.bluePrimary,
    alignItems: 'center', justifyContent: 'center',
  },
  sendBtnDisabled: { backgroundColor: Colors.border },
  sendTxt: { color: Colors.white, fontSize: 18, fontWeight: '800' },
});
