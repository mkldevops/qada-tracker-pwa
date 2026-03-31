import i18n from 'i18next';
import LanguageDetector from 'i18next-browser-languagedetector';
import { initReactI18next } from 'react-i18next';
import ar from './locales/ar.json';
import en from './locales/en.json';
import fr from './locales/fr.json';

i18n
	.use(LanguageDetector)
	.use(initReactI18next)
	.init({
		resources: {
			fr: { translation: fr },
			en: { translation: en },
			ar: { translation: ar },
		},
		fallbackLng: 'fr',
		supportedLngs: ['fr', 'en', 'ar'],
		detection: {
			order: ['localStorage', 'navigator'],
			caches: ['localStorage'],
		},
		interpolation: { escapeValue: false },
	});

export default i18n;
