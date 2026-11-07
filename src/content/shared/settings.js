// ===== SHARED SETTINGS =====

const SUPPORTED_LANGUAGES = ['en', 'es', 'hi', 'pt', 'fr', 'de'];
const FALLBACK_LANGUAGE = 'en';

const I18N_STRINGS = {
	en: {
		'placeholder.alt': 'Stay Focused!'
	},
	es: {
		'placeholder.alt': '¡Concéntrate!'
	},
	hi: {
		'placeholder.alt': 'ध्यान केंद्रित रखें!'
	},
	pt: {
		'placeholder.alt': 'Mantenha o foco!'
	},
	fr: {
		'placeholder.alt': 'Reste concentré !'
	},
	de: {
		'placeholder.alt': 'Bleib fokussiert!'
	}
};

let activeLanguage = FALLBACK_LANGUAGE;

function formatTemplate(template, replacements) {
	if (!template || !replacements) return template;
	return Object.keys(replacements).reduce((result, key) => {
		const value = replacements[key];
		return result.replace(new RegExp(`{${key}}`, 'g'), value);
	}, template);
}

function getBrowserLanguage() {
	try {
		if (browser && browser.i18n && typeof browser.i18n.getUILanguage === 'function') {
			return browser.i18n.getUILanguage();
		}
	} catch (error) {
		console.debug('LockedIn: Unable to detect browser language', error);
	}
	if (typeof navigator !== 'undefined' && navigator.language) {
		return navigator.language;
	}
	return FALLBACK_LANGUAGE;
}

function resolveLanguagePreference(preferred) {
	if (preferred && preferred !== 'auto' && SUPPORTED_LANGUAGES.includes(preferred)) {
		return preferred;
	}
	const browserLang = (getBrowserLanguage() || '').toLowerCase();
	const exactMatch = SUPPORTED_LANGUAGES.find((code) => browserLang === code);
	if (exactMatch) {
		return exactMatch;
	}
	const partialMatch = SUPPORTED_LANGUAGES.find((code) => browserLang.startsWith(`${code}-`));
	return partialMatch || FALLBACK_LANGUAGE;
}

function setActiveLanguage(languageCode) {
	activeLanguage = SUPPORTED_LANGUAGES.includes(languageCode) ? languageCode : FALLBACK_LANGUAGE;
}

function translate(key, replacements = null, languageCode = activeLanguage) {
	if (!key) {
		return '';
	}
	const languagePack = I18N_STRINGS[languageCode] || I18N_STRINGS[FALLBACK_LANGUAGE] || {};
	let template = languagePack[key];
	if (template === undefined) {
		const fallbackPack = I18N_STRINGS[FALLBACK_LANGUAGE] || {};
		template = fallbackPack[key] || '';
	}
	if (!template) {
		return '';
	}
	return replacements ? formatTemplate(template, replacements) : template;
}

async function initLocalization() {
	try {
		const stored = await browser.storage.sync.get('language');
		const preferred = stored.language || 'auto';
		setActiveLanguage(resolveLanguagePreference(preferred));
	} catch (error) {
		console.debug('LockedIn: Unable to initialize localization', error);
		setActiveLanguage(FALLBACK_LANGUAGE);
	}
}

function handleLanguagePreferenceChange(preferred) {
	setActiveLanguage(resolveLanguagePreference(preferred || 'auto'));
}

const DEFAULT_SETTINGS = {
	hideFeed: false,
	redirectToSubs: false,
	hideMostRelevantSubscriptions: false,
	hideSubsLiveStreams: false,
	hideShortsHomepage: false,
	hideExploreMoreTopics: false,
	cleanHomepageFeed: false,
	hideCommunityPosts: false,
	hideFeaturedContent: false,
	hideMembersOnly: false,
	hidePlayables: false,
	cleanSidebar: false,
	hideShortsGlobally: false,
	redirectShorts: false,
	hideVideoThumbnails: false,
	hideSidebar: false,
	hideRecommended: false,
	hideSidebarShorts: false,
	hideLiveChat: false,
	hideEndCards: false,
	disableAutoplay: false,
	disablePlaylistAutoplay: false,
	disableRegularAutoplay: false,
	hideComments: false,
	hideSearchRecommended: false,
	hideShortsSearch: false,
	hideExplore: false,
	hideMoreFromYT: false,
	hidePlaylists: false,
	hideSubscriptions: false,
	hideFeedQuote: false,
	showFeedSearchWidget: true,
	extensionEnabled: true
};

let latestSyncedSettings = { ...DEFAULT_SETTINGS };

initLocalization();
