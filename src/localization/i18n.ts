import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import { storage, StorageKeys } from '../services/storage';

import ta from './ta.json';
import en from './en.json';
import kn from './kn.json';
import te from './te.json';
import hi from './hi.json';

const resources = {
  ta: { translation: ta },
  en: { translation: en },
  kn: { translation: kn },
  te: { translation: te },
  hi: { translation: hi },
};

// Check if a language was previously saved in storage
const savedLanguage = storage.getString(StorageKeys.LANGUAGE);

i18n
  .use(initReactI18next)
  .init({
    resources,
    // Set Tamil as default if no language was saved
    lng: savedLanguage || 'ta',
    fallbackLng: 'en',
    interpolation: {
      escapeValue: false, // react already safes from xss
    },
  });

export default i18n;
