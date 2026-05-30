import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import { storage, StorageKeys } from '../services/storage';

import en from '../assets/locales/en.json';
import es from '../assets/locales/es.json';

const resources = {
  en: { translation: en },
  es: { translation: es },
};

const savedLanguage = storage.getString(StorageKeys.LANGUAGE);

i18n
  .use(initReactI18next)
  .init({
    resources,
    lng: savedLanguage || 'en',
    fallbackLng: 'en',
    interpolation: {
      escapeValue: false, // react already safes from xss
    },
  });

export default i18n;
