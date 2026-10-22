// ===== CROSS-BROWSER COMPATIBILITY =====
if (typeof browser === 'undefined') {
  var browser = chrome;
}

// ===== DEFAULT SETTINGS =====
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
  extensionEnabled: true,
  lightMode: false,
  hideFeedQuote: false,
  takeBreak: false,
  breakDuration: 5,
  customMeme: null,
  appearance: 'auto',
  language: 'auto',
  settingsLockDuration: 0,
  settingsLockHideCountdown: false
};

// Seconds the popup stays locked on open (0 = Settings Lock Timer off)
const SETTINGS_LOCK_OPTIONS = [0, 5, 10, 15, 30, 60, 120, 180, 300];

const APPEARANCE_OPTIONS = ['auto', 'light', 'dark'];
const APPEARANCE_LABEL_KEYS = {
  auto: 'appearance.option.auto',
  light: 'appearance.option.light',
  dark: 'appearance.option.dark'
};

const LANGUAGE_LABELS = {
  auto: { labelKey: 'language.option.auto', fallback: 'Auto' },
  en: { label: 'English' },
  es: { label: 'Español' },
  hi: { label: 'हिन्दी' },
  pt: { label: 'Português' },
  fr: { label: 'Français' },
  de: { label: 'Deutsch' },
  'zh-CN': {label: "简体中文"},
  'zh-TW': {label: "繁体中文"}
};

const LANGUAGE_OPTIONS = Object.keys(LANGUAGE_LABELS);
const SUPPORTED_LANGUAGES = ['en', 'es', 'hi', 'pt', 'fr', 'de', 'zh-CN', 'zh-TW'];
const FALLBACK_LANGUAGE = 'en';
const THUMBNAIL_MODE_OPTIONS = ['off', 'blurred', 'hidden', 'reveal-on-hover', 'solid-color'];
const THUMBNAIL_MODE_LABEL_KEYS = {
  off: 'thumbnail.disable',
  blurred: 'thumbnail.blur',
  hidden: 'thumbnail.hidden',
  'reveal-on-hover': 'thumbnail.revealOnHover',
  'solid-color': 'thumbnail.solidColor'
};
const THUMBNAIL_MODE_FALLBACK_LABELS = {
  off: 'Disable',
  blurred: 'Blur',
  hidden: 'Hidden',
  'reveal-on-hover': 'Reveal on Hover',
  'solid-color': 'Solid Color'
};

function isYouTubeTabUrl(tabUrl) {
  if (!tabUrl) {
    return false;
  }

  try {
    const hostname = new URL(tabUrl).hostname.toLowerCase();
    return hostname === 'youtube.com' || hostname.endsWith('.youtube.com');
  } catch (_error) {
    return false;
  }
}

const I18N_STRINGS = {
  en: {
    'tooltip.menu': 'Menu',
    'tooltip.power': 'Toggle Extension',
    'tooltip.close': 'Close',
    'power.instant': 'Turn Off Now',
    'power.ten': 'Turn Off for 10 min',
    'power.twenty': 'Turn Off for 20 min',
    'power.thirty': 'Turn Off for 30 min',
    'menu.title': 'Menu',
    'menu.option.hideFeedQuote': 'Hide Motivational Quotes',
    'menu.option.appearance': 'Extension Appearance',
    'menu.option.language': 'Extension Language',
    'menu.option.hideFeedQuote.desc': 'Hide the motivational quote shown when your homepage feed is blocked.',
    'menu.option.appearance.desc': 'Choose Auto, Light, or Dark theme for the extension popup.',
    'menu.option.language.desc': 'Set popup language manually, or keep Auto to follow browser language.',
    'appearance.option.auto': 'Auto',
    'appearance.option.light': 'Light',
    'appearance.option.dark': 'Dark',
    'language.option.auto': 'Auto',
    'menu.option.settingsLock': 'Settings Lock Timer',
    'menu.option.settingsLock.desc': 'Make yourself wait before changing settings each time you open LockedIn.',
    'settingsLock.option.off': 'Off',
    'settingsLock.option.seconds': '{seconds}s',
    'menu.option.settingsLockHideCountdown': 'Hide Countdown',
    'menu.option.settingsLockHideCountdown.desc': 'Hide the time left while settings are locked, so you wait without knowing how long.',
    'settingsLock.option.minutes': '{minutes} min',
    'settingsLock.title': 'Settings locked',
    'settingsLock.subtitle': 'Take a breath. Do you really need to change something?',
    'group.homepage': 'Homepage',
    'group.subscriptionsPage': 'Subscriptions Page',
    'setting.hideFeed': 'Hide Homepage Feed',
    'setting.redirectToSubs': 'Redirect to Subscriptions',
    'setting.hideMostRelevant': "Hide 'Most Relevant'",
    'setting.hideSubsLiveStreams': 'Hide Live Streams',
    'setting.hideShortsHomepage': 'Hide YouTube Shorts',
    'setting.hideExploreMoreTopics': 'Hide Explore More Topics',
    'setting.cleanHomepageFeed': 'Clean Homepage Feed',
    'setting.hideCommunityPosts': 'Hide Community Posts',
    'setting.cleanSidebar': 'Clean Sidebar',
    'setting.hideFeaturedContent': 'Hide Featured Content',
    'setting.hideMembersOnly': 'Hide Members Only Content',
    'setting.hidePlayables': 'Hide YouTube Playables',
    'group.shorts': 'YouTube Shorts',
    'setting.hideShortsGlobal': 'Hide Shorts (All Pages)',
    'setting.redirectShorts': 'Redirect Shorts',
    'group.thumbnails': 'Thumbnails',
    'setting.hideVideoThumbnails': 'Hide Thumbnails',
    'thumbnail.disable': 'Disable',
    'thumbnail.blur': 'Blur',
    'thumbnail.hidden': 'Hidden',
    'thumbnail.revealOnHover': 'Reveal on Hover',
    'thumbnail.solidColor': 'Solid Color',
    'group.video': 'Video Page',
    'setting.hideSidebar': 'Hide Video Sidebar',
    'setting.hideRecommended': 'Hide Recommended Videos',
    'setting.hideSidebarShorts': 'Hide YouTube Shorts',
    'setting.hidePlaylists': 'Hide Playlists',
    'setting.hideSubscriptions': 'Hide Subscriptions',
    'setting.hideEndCards': 'Hide End Screen Cards',
    'setting.hideComments': 'Hide Comments',
    'setting.hideLiveChat': 'Hide Live Chat',
    'setting.disableAutoplay': 'Disable Autoplay',
    'setting.disablePlaylistAutoplay': 'Disable for Playlist Videos',
    'setting.disableRegularAutoplay': 'Disable for Regular Videos',
    'group.search': 'Search Results',
    'setting.hideShortsSearch': 'Hide YouTube Shorts',
    'group.sidebar': 'YouTube Sidebar',
    'setting.hideExplore': 'Hide Explore & Trending',
    'setting.hideMoreFromYT': 'Hide More From YouTube',
    'state.lockedinOff': 'LockedIn is off',
    'state.breakTimerPrefix': 'See you in',
    'sponsor.title': 'Support LockedIn',
    'sponsor.body': `Donate via <a href="https://github.com/sponsors/KartikHalkunde" target="_blank" class="sponsor-link">GitHub Sponsors<svg class="heart-icon" viewBox="0 0 16 16" fill="currentColor"><path d="M4.25 2.5c-1.336 0-2.75 1.164-2.75 3 0 2.15 1.58 4.144 3.365 5.682A20.565 20.565 0 008 13.393a20.561 20.561 0 003.135-2.211C12.92 9.644 14.5 7.65 14.5 5.5c0-1.836-1.414-3-2.75-3-1.373 0-2.609.986-3.029 2.456a.75.75 0 01-1.442 0C6.859 3.486 5.623 2.5 4.25 2.5zM8 14.25l-.345.666-.002-.001-.006-.003-.018-.01a7.643 7.643 0 01-.31-.17 22.075 22.075 0 01-3.434-2.414C2.045 10.731 0 8.35 0 5.5 0 2.836 2.086 1 4.25 1 5.797 1 7.153 1.802 8 3.02 8.847 1.802 10.203 1 11.75 1 13.914 1 16 2.836 16 5.5c0 2.85-2.045 5.231-3.885 6.818a22.08 22.08 0 01-3.744 2.584l-.018.01-.006.003h-.002L8 14.25zm0 0l.345.666a.752.752 0 01-.69 0L8 14.25z"/></svg></a> or <a href="https://kartikhalkunde.github.io/LockedIn-YT/upi.html" target="_blank" class="sponsor-link">UPI</a> to support my work.`,
    'sponsor.bodySecondary': `If you can't contribute financially, I would appreciate if you could share LockedIn with friends or leave a review on <a href="https://addons.mozilla.org/en-US/firefox/addon/lockedin-yt/?utm_source=addons.mozilla.org&utm_medium=referral&utm_content=search" target="_blank" class="sponsor-link">Firefox</a><br>or <a href="https://microsoftedge.microsoft.com/addons/detail/lockedin/hibjbjgfbmhpiaapeccnfddnpabnlklj" target="_blank" class="sponsor-link">MS Edge</a>.`,
    'feedback.title': 'Feedback',
    'feedback.requestHeading': 'Request a Feature',
    'feedback.requestText': `Have an idea to make LockedIn even better? <a href="https://forms.gle/sPsfwB6C16Yx299f9" target="_blank" class="feedback-link-red">Request it here.</a>`,
    'feedback.bugHeading': 'Found a Bug?',
    'feedback.bugText': `YouTube constantly keeps updating the layout. If you found a bug, <a href="https://forms.gle/9zPoc7yQpDcKD4kP9" target="_blank" class="feedback-link-red">report it here.</a>`,
    'footer.sponsor': 'Sponsor',
    'footer.feedback': 'Feedback',
    'customMeme.tooLarge': 'File "{filename}" is too large! Maximum size is 500KB per image.',
    'customMeme.invalidType': 'File "{filename}" has an invalid type! Use PNG, JPG, GIF, or WebP.',
    'customMeme.maxImages': 'Maximum 5 images allowed! You already have {existing} and tried to add {added}.',
    'customMeme.unableUpdate': 'Unable to update custom images. Please try again.',
    'customMeme.unableSave': 'Unable to save these images. Please try again.',
    'sponsor.tagline': 'If you find LockedIn helpful, please consider making a contribution.',
    'donation.github.title': 'GitHub Sponsors',
    'donation.github.subtitle': 'Little to no platform fee',
    'donation.bmc.title': 'Buy Me a Coffee',
    'donation.bmc.subtitle': 'Simple one-time support',
    'donation.paypal.title': 'PayPal',
    'donation.paypal.subtitle': 'Secure payments worldwide',
    'donation.upi.title': 'UPI',
    'donation.upi.subtitle': 'For Indian users',
    'sponsor.review.text': 'If you can\'t contribute financially, I\'d love if you could share LockedIn with friends or leave a review on the Firefox or Edge stores.'
  },
  es: {
    'tooltip.menu': 'Menú',
    'tooltip.power': 'Activar o desactivar',
    'tooltip.close': 'Cerrar',
    'power.instant': 'Desactivar ahora',
    'power.ten': 'Desactivar por 10 min',
    'power.twenty': 'Desactivar por 20 min',
    'power.thirty': 'Desactivar por 30 min',
    'menu.title': 'Menú',
    'menu.option.hideFeedQuote': 'Ocultar citas motivacionales',
    'menu.option.appearance': 'Apariencia de la extensión',
    'menu.option.language': 'Idioma de la extensión',
    'menu.option.hideFeedQuote.desc': 'Oculta la cita motivacional cuando el feed de inicio está bloqueado.',
    'menu.option.appearance.desc': 'Elige tema Automático, Claro u Oscuro para el popup.',
    'menu.option.language.desc': 'Define el idioma del popup o usa Automático según tu navegador.',
    'appearance.option.auto': 'Automático',
    'appearance.option.light': 'Claro',
    'appearance.option.dark': 'Oscuro',
    'language.option.auto': 'Automático',
    'menu.option.settingsLock': 'Temporizador de bloqueo',
    'menu.option.settingsLock.desc': 'Espera unos segundos antes de cambiar los ajustes cada vez que abras LockedIn.',
    'settingsLock.option.off': 'Desactivado',
    'settingsLock.option.seconds': '{seconds} s',
    'menu.option.settingsLockHideCountdown': 'Ocultar cuenta atrás',
    'menu.option.settingsLockHideCountdown.desc': 'Oculta el tiempo restante mientras los ajustes están bloqueados, para que esperes sin saber cuánto falta.',
    'settingsLock.option.minutes': '{minutes} min',
    'settingsLock.title': 'Ajustes bloqueados',
    'settingsLock.subtitle': 'Respira. ¿De verdad necesitas cambiar algo?',
    'group.homepage': 'Página principal',
    'group.subscriptionsPage': 'Página de suscripciones',
    'setting.hideFeed': 'Ocultar feed de inicio',
    'setting.redirectToSubs': 'Redirigir a Suscripciones',
    'setting.hideMostRelevant': "Ocultar 'Más relevantes'",
    'setting.hideSubsLiveStreams': 'Ocultar transmisiones en vivo',
    'setting.hideShortsHomepage': 'Ocultar Shorts de YouTube',
    'setting.hideExploreMoreTopics': 'Ocultar Explorar mas temas',
    'setting.cleanHomepageFeed': 'Limpiar feed de inicio',
    'setting.hideCommunityPosts': 'Ocultar publicaciones de la comunidad',
    'setting.cleanSidebar': 'Limpiar barra lateral',
    'setting.hideFeaturedContent': 'Ocultar contenido destacado',
    'setting.hideMembersOnly': 'Ocultar contenido solo para miembros',
    'group.shorts': 'YouTube Shorts',
    'setting.hideShortsGlobal': 'Ocultar Shorts (todas las páginas)',
    'setting.redirectShorts': 'Redirigir Shorts',
    'group.thumbnails': 'Miniaturas',
    'setting.hideVideoThumbnails': 'Ocultar Miniaturas',
    'thumbnail.disable': 'Desactivar',
    'thumbnail.blur': 'Desenfoque',
    'thumbnail.hidden': 'Oculto',
    'thumbnail.revealOnHover': 'Revelar al pasar',
    'thumbnail.solidColor': 'Color sólido',
    'group.video': 'Página de video',
    'setting.hideSidebar': 'Ocultar barra lateral del video',
    'setting.hideRecommended': 'Ocultar videos recomendados',
    'setting.hideSidebarShorts': 'Ocultar Shorts de YouTube',
    'setting.hidePlaylists': 'Ocultar listas de reproducción',
    'setting.hideSubscriptions': 'Ocultar suscripciones',
    'setting.hideEndCards': 'Ocultar pantallas finales',
    'setting.hideComments': 'Ocultar comentarios',
    'setting.hideLiveChat': 'Ocultar chat en vivo',
    'setting.disableAutoplay': 'Desactivar reproducción automática',
    'group.search': 'Resultados de búsqueda',
    'setting.hideShortsSearch': 'Ocultar Shorts de YouTube',
    'group.sidebar': 'Barra lateral de YouTube',
    'setting.hideExplore': 'Ocultar Explorar y Tendencias',
    'setting.hideMoreFromYT': 'Ocultar Más de YouTube',
    'state.lockedinOff': 'LockedIn está desactivado',
    'state.breakTimerPrefix': 'Te veo en',
    'sponsor.title': 'Apoya LockedIn',
    'sponsor.tagline': 'Si LockedIn te resulta útil, considera hacer una contribución.',
    'donation.github.title': 'GitHub Sponsors',
    'donation.github.subtitle': 'Poca o ninguna comisión de plataforma',
    'donation.bmc.title': 'Cómprame un café',
    'donation.bmc.subtitle': 'Apoyo sencillo de una sola vez',
    'donation.paypal.title': 'PayPal',
    'donation.paypal.subtitle': 'Pagos seguros en todo el mundo',
    'donation.upi.title': 'UPI',
    'donation.upi.subtitle': 'Para usuarios de India',
    'sponsor.review.text': 'Si no puedes contribuir económicamente, me encantaría que compartieras LockedIn con amigos o dejaras una reseña en las tiendas de Firefox o Edge.',
    'sponsor.body': `Dona vía <a href="https://github.com/sponsors/KartikHalkunde" target="_blank" class="sponsor-link">GitHub Sponsors<svg class="heart-icon" viewBox="0 0 16 16" fill="currentColor"><path d="M4.25 2.5c-1.336 0-2.75 1.164-2.75 3 0 2.15 1.58 4.144 3.365 5.682A20.565 20.565 0 008 13.393a20.561 20.561 0 003.135-2.211C12.92 9.644 14.5 7.65 14.5 5.5c0-1.836-1.414-3-2.75-3-1.373 0-2.609.986-3.029 2.456a.75.75 0 01-1.442 0C6.859 3.486 5.623 2.5 4.25 2.5zM8 14.25l-.345.666-.002-.001-.006-.003-.018-.01a7.643 7.643 0 01-.31-.17 22.075 22.075 0 01-3.434-2.414C2.045 10.731 0 8.35 0 5.5 0 2.836 2.086 1 4.25 1 5.797 1 7.153 1.802 8 3.02 8.847 1.802 10.203 1 11.75 1 13.914 1 16 2.836 16 5.5c0 2.85-2.045 5.231-3.885 6.818a22.08 22.08 0 01-3.744 2.584l-.018.01-.006.003h-.002L8 14.25zm0 0l.345.666a.752.752 0 01-.69 0L8 14.25z"/></svg></a> o <a href="https://kartikhalkunde.github.io/LockedIn-YT/upi.html" target="_blank" class="sponsor-link">UPI</a> para apoyar mi trabajo.`,
    'sponsor.bodySecondary': `Si no puedes contribuir económicamente, agradecería que compartieras LockedIn con amigos o dejaras una reseña en <a href="https://addons.mozilla.org/en-US/firefox/addon/lockedin-yt/?utm_source=addons.mozilla.org&utm_medium=referral&utm_content=search" target="_blank" class="sponsor-link">Firefox</a><br>o <a href="https://microsoftedge.microsoft.com/addons/detail/lockedin/hibjbjgfbmhpiaapeccnfddnpabnlklj" target="_blank" class="sponsor-link">MS Edge</a>.`,
    'feedback.title': 'Comentarios',
    'feedback.requestHeading': 'Solicita una función',
    'feedback.requestText': `¿Tienes una idea para mejorar LockedIn? <a href="https://forms.gle/sPsfwB6C16Yx299f9" target="_blank" class="feedback-link-red">Pídela aquí.</a>`,
    'feedback.bugHeading': '¿Encontraste un error?',
    'feedback.bugText': `YouTube cambia el diseño constantemente. Si encontraste un error, <a href="https://forms.gle/9zPoc7yQpDcKD4kP9" target="_blank" class="feedback-link-red">repórtalo aquí.</a>`,
    'footer.sponsor': 'Patrocinar',
    'footer.feedback': 'Comentarios',
    'customMeme.tooLarge': 'El archivo "{filename}" es demasiado grande. El máximo es 500 KB por imagen.',
    'customMeme.invalidType': 'El archivo "{filename}" tiene un tipo no válido. Usa PNG, JPG, GIF o WebP.',
    'customMeme.maxImages': 'Solo se permiten 5 imágenes. Ya tienes {existing} e intentaste agregar {added}.',
    'customMeme.unableUpdate': 'No se pudieron actualizar las imágenes personalizadas. Inténtalo de nuevo.',
    'customMeme.unableSave': 'No se pudieron guardar estas imágenes. Inténtalo de nuevo.'
  },
  hi: {
    'tooltip.menu': 'मेन्यू',
    'tooltip.power': 'एक्सटेंशन चालू/बंद करें',
    'tooltip.close': 'बंद करें',
    'power.instant': 'अभी बंद करें',
    'power.ten': '10 मिनट के लिए बंद करें',
    'power.twenty': '20 मिनट के लिए बंद करें',
    'power.thirty': '30 मिनट के लिए बंद करें',
    'menu.title': 'मेन्यू',
    'menu.option.hideFeedQuote': 'प्रेरणादायक उद्धरण छुपाएँ',
    'menu.option.appearance': 'एक्सटेंशन की रूपरेखा',
    'menu.option.language': 'एक्सटेंशन की भाषा',
    'menu.option.hideFeedQuote.desc': 'फ़ीड ब्लॉक होने पर दिखने वाले प्रेरक उद्धरण को छुपाएँ।',
    'menu.option.appearance.desc': 'पॉपअप के लिए Auto, Light या Dark थीम चुनें।',
    'menu.option.language.desc': 'पॉपअप भाषा सेट करें, या Auto रखकर ब्राउज़र भाषा अपनाएँ।',
    'appearance.option.auto': 'स्वचालित',
    'appearance.option.light': 'हल्का',
    'appearance.option.dark': 'गहरा',
    'language.option.auto': 'स्वचालित',
    'menu.option.settingsLock': 'सेटिंग्स लॉक टाइमर',
    'menu.option.settingsLock.desc': 'हर बार LockedIn खोलने पर सेटिंग्स बदलने से पहले कुछ सेकंड रुकें।',
    'settingsLock.option.off': 'बंद',
    'settingsLock.option.seconds': '{seconds} से.',
    'menu.option.settingsLockHideCountdown': 'उलटी गिनती छुपाएँ',
    'menu.option.settingsLockHideCountdown.desc': 'सेटिंग्स लॉक रहने तक बचा समय छुपाएँ, ताकि आप बिना जाने इंतज़ार करें कि कितना समय बचा है।',
    'settingsLock.option.minutes': '{minutes} मि.',
    'settingsLock.title': 'सेटिंग्स लॉक हैं',
    'settingsLock.subtitle': 'गहरी साँस लें। क्या सच में कुछ बदलना ज़रूरी है?',
    'group.homepage': 'होमपेज',
    'group.subscriptionsPage': 'सब्सक्रिप्शन पेज',
    'setting.hideFeed': 'होमपेज फ़ीड छुपाएँ',
    'setting.redirectToSubs': 'सब्सक्रिप्शन पर ले जाएँ',
    'setting.hideMostRelevant': "'Most Relevant' छुपाएँ",
    'setting.hideSubsLiveStreams': 'लाइव स्ट्रीम छुपाएँ',
    'setting.hideShortsHomepage': 'YouTube शॉर्ट्स छुपाएँ',
    'setting.hideExploreMoreTopics': 'Explore more topics छुपाएँ',
    'setting.cleanHomepageFeed': 'होमपेज फ़ीड साफ़ करें',
    'setting.hideCommunityPosts': 'कम्युनिटी पोस्ट छुपाएँ',
    'setting.cleanSidebar': 'साइडबार साफ़ करें',
    'setting.hideFeaturedContent': 'फ़ीचर्ड कंटेंट छुपाएँ',
    'setting.hideMembersOnly': 'सदस्य-विशेष कंटेंट छुपाएँ',
    'group.shorts': 'YouTube शॉर्ट्स',
    'setting.hideShortsGlobal': 'शॉर्ट्स छुपाएँ (सभी पेज)',
    'setting.redirectShorts': 'शॉर्ट्स को रीडायरेक्ट करें',
    'group.thumbnails': 'थंबनेल',
    'setting.hideVideoThumbnails': 'थंबनेल छुपाएँ',
    'thumbnail.disable': 'अक्षम करें',
    'thumbnail.blur': 'धुंधला करें',
    'thumbnail.hidden': 'छिपाएँ',
    'thumbnail.revealOnHover': 'होवर पर प्रकट करें',
    'thumbnail.solidColor': 'ठोस रंग',
    'group.video': 'वीडियो पेज',
    'setting.hideSidebar': 'वीडियो साइडबार छुपाएँ',
    'setting.hideRecommended': 'अनुशंसित वीडियो छुपाएँ',
    'setting.hideSidebarShorts': 'YouTube शॉर्ट्स छुपाएँ',
    'setting.hidePlaylists': 'प्लेलिस्ट छुपाएँ',
    'setting.hideSubscriptions': 'सदस्यताएँ छुपाएँ',
    'setting.hideEndCards': 'एंड स्क्रीन कार्ड छुपाएँ',
    'setting.hideComments': 'कमेंट्स छुपाएँ',
    'setting.hideLiveChat': 'लाइव चैट छुपाएँ',
    'setting.disableAutoplay': 'ऑटोप्ले बंद करें',
    'group.search': 'खोज परिणाम',
    'setting.hideShortsSearch': 'YouTube शॉर्ट्स छुपाएँ',
    'group.sidebar': 'YouTube साइडबार',
    'setting.hideExplore': 'एक्सप्लोर और ट्रेंडिंग छुपाएँ',
    'setting.hideMoreFromYT': 'More From YouTube छुपाएँ',
    'state.lockedinOff': 'LockedIn बंद है',
    'state.breakTimerPrefix': 'मिलते हैं',
    'sponsor.title': 'LockedIn को सपोर्ट करें',
    'sponsor.tagline': 'अगर आपको LockedIn उपयोगी लगता है, तो कृपया योगदान करने पर विचार करें।',
    'donation.github.title': 'GitHub Sponsors',
    'donation.github.subtitle': 'बहुत कम या बिना प्लेटफ़ॉर्म शुल्क',
    'donation.bmc.title': 'मुझे कॉफ़ी पिलाएँ',
    'donation.bmc.subtitle': 'सरल एक-बार समर्थन',
    'donation.paypal.title': 'PayPal',
    'donation.paypal.subtitle': 'दुनिया भर में सुरक्षित भुगतान',
    'donation.upi.title': 'UPI',
    'donation.upi.subtitle': 'भारत के उपयोगकर्ताओं के लिए',
    'sponsor.review.text': 'अगर आप आर्थिक रूप से योगदान नहीं कर सकते, तो कृपया LockedIn को दोस्तों के साथ साझा करें या Firefox या Edge स्टोर्स पर समीक्षा छोड़ें।',
    'sponsor.body': `मेरे काम को सपोर्ट करने के लिए <a href="https://github.com/sponsors/KartikHalkunde" target="_blank" class="sponsor-link">GitHub Sponsors<svg class="heart-icon" viewBox="0 0 16 16" fill="currentColor"><path d="M4.25 2.5c-1.336 0-2.75 1.164-2.75 3 0 2.15 1.58 4.144 3.365 5.682A20.565 20.565 0 008 13.393a20.561 20.561 0 003.135-2.211C12.92 9.644 14.5 7.65 14.5 5.5c0-1.836-1.414-3-2.75-3-1.373 0-2.609.986-3.029 2.456a.75.75 0 01-1.442 0C6.859 3.486 5.623 2.5 4.25 2.5zM8 14.25l-.345.666-.002-.001-.006-.003-.018-.01a7.643 7.643 0 01-.31-.17 22.075 22.075 0 01-3.434-2.414C2.045 10.731 0 8.35 0 5.5 0 2.836 2.086 1 4.25 1 5.797 1 7.153 1.802 8 3.02 8.847 1.802 10.203 1 11.75 1 13.914 1 16 2.836 16 5.5c0 2.85-2.045 5.231-3.885 6.818a22.08 22.08 0 01-3.744 2.584l-.018.01-.006.003h-.002L8 14.25zm0 0l.345.666a.752.752 0 01-.69 0L8 14.25z"/></svg></a> या <a href="https://kartikhalkunde.github.io/LockedIn-YT/upi.html" target="_blank" class="sponsor-link">UPI</a> पर दान करें।`,
    'sponsor.bodySecondary': `अगर आप आर्थिक रूप से मदद नहीं कर सकते, तो LockedIn को दोस्तों के साथ साझा करें या <a href="https://addons.mozilla.org/en-US/firefox/addon/lockedin-yt/?utm_source=addons.mozilla.org&utm_medium=referral&utm_content=search" target="_blank" class="sponsor-link">Firefox</a><br>या <a href="https://microsoftedge.microsoft.com/addons/detail/lockedin/hibjbjgfbmhpiaapeccnfddnpabnlklj" target="_blank" class="sponsor-link">MS Edge</a> पर समीक्षा छोड़ें।`,
    'feedback.title': 'फ़ीडबैक',
    'feedback.requestHeading': 'फ़ीचर का अनुरोध करें',
    'feedback.requestText': `LockedIn को बेहतर बनाने का कोई विचार है? <a href="https://forms.gle/sPsfwB6C16Yx299f9" target="_blank" class="feedback-link-red">यहाँ अनुरोध करें।</a>`,
    'feedback.bugHeading': 'बग मिला?',
    'feedback.bugText': `YouTube लगातार लेआउट बदलता रहता है। अगर कोई बग मिला है तो <a href="https://forms.gle/9zPoc7yQpDcKD4kP9" target="_blank" class="feedback-link-red">यहाँ रिपोर्ट करें।</a>`,
    'footer.sponsor': 'सपोर्ट',
    'footer.feedback': 'फ़ीडबैक',
    'customMeme.tooLarge': 'फ़ाइल "{filename}" बहुत बड़ी है। प्रत्येक छवि के लिए अधिकतम 500KB की अनुमति है।',
    'customMeme.invalidType': 'फ़ाइल "{filename}" का प्रकार मान्य नहीं है। PNG, JPG, GIF या WebP का उपयोग करें।',
    'customMeme.maxImages': 'अधिकतम 5 छवियाँ अनुमत हैं। आपके पास पहले से {existing} हैं और आपने {added} जोड़ने की कोशिश की।',
    'customMeme.unableUpdate': 'कस्टम छवियाँ अपडेट नहीं हो सकीं। कृपया दोबारा प्रयास करें।',
    'customMeme.unableSave': 'इन छवियों को सहेजा नहीं जा सका। कृपया दोबारा प्रयास करें।'
  },
  pt: {
    'tooltip.menu': 'Menu',
    'tooltip.power': 'Ativar/desativar',
    'tooltip.close': 'Fechar',
    'power.instant': 'Desativar agora',
    'power.ten': 'Ativar por 10 min',
    'power.twenty': 'Ativar por 20 min',
    'power.thirty': 'Ativar por 30 min',
    'menu.title': 'Menu',
    'menu.option.hideFeedQuote': 'Ocultar citações motivacionais',
    'menu.option.appearance': 'Aparência da extensão',
    'menu.option.language': 'Idioma da extensão',
    'menu.option.hideFeedQuote.desc': 'Oculta a citação motivacional quando o feed inicial está bloqueado.',
    'menu.option.appearance.desc': 'Escolha o tema Automático, Claro ou Escuro para o popup.',
    'menu.option.language.desc': 'Defina o idioma do popup ou use Automático para seguir o navegador.',
    'appearance.option.auto': 'Automático',
    'appearance.option.light': 'Claro',
    'appearance.option.dark': 'Escuro',
    'language.option.auto': 'Automático',
    'menu.option.settingsLock': 'Temporizador de bloqueio',
    'menu.option.settingsLock.desc': 'Espere alguns segundos antes de alterar as configurações sempre que abrir o LockedIn.',
    'settingsLock.option.off': 'Desativado',
    'settingsLock.option.seconds': '{seconds} s',
    'menu.option.settingsLockHideCountdown': 'Ocultar contagem regressiva',
    'menu.option.settingsLockHideCountdown.desc': 'Oculta o tempo restante enquanto as configurações estão bloqueadas, para você esperar sem saber quanto falta.',
    'settingsLock.option.minutes': '{minutes} min',
    'settingsLock.title': 'Configurações bloqueadas',
    'settingsLock.subtitle': 'Respire fundo. Você precisa mesmo mudar algo?',
    'group.homepage': 'Página inicial',
    'group.subscriptionsPage': 'Página de inscrições',
    'setting.hideFeed': 'Ocultar feed inicial',
    'setting.redirectToSubs': 'Redirecionar para Inscrições',
    'setting.hideMostRelevant': "Ocultar 'Mais relevantes'",
    'setting.hideSubsLiveStreams': 'Ocultar transmissões ao vivo',
    'setting.hideShortsHomepage': 'Ocultar Shorts do YouTube',
    'setting.hideExploreMoreTopics': 'Ocultar Explorar mais temas',
    'setting.cleanHomepageFeed': 'Limpar feed inicial',
    'setting.hideCommunityPosts': 'Ocultar postagens da comunidade',
    'setting.cleanSidebar': 'Limpar barra lateral',
    'setting.hideFeaturedContent': 'Ocultar conteúdo em destaque',
    'setting.hideMembersOnly': 'Ocultar conteúdo exclusivo para membros',
    'group.shorts': 'YouTube Shorts',
    'setting.hideShortsGlobal': 'Ocultar Shorts (todas as páginas)',
    'setting.redirectShorts': 'Redirecionar Shorts',
    'group.thumbnails': 'Miniaturas',
    'setting.hideVideoThumbnails': 'Ocultar Miniaturas',
    'thumbnail.disable': 'Desabilitar',
    'thumbnail.blur': 'Desfoque',
    'thumbnail.hidden': 'Oculto',
    'thumbnail.revealOnHover': 'Revelar ao passar o mouse',
    'thumbnail.solidColor': 'Cor sólida',
    'group.video': 'Página de vídeo',
    'setting.hideSidebar': 'Ocultar barra lateral do vídeo',
    'setting.hideRecommended': 'Ocultar vídeos recomendados',
    'setting.hideSidebarShorts': 'Ocultar Shorts do YouTube',
    'setting.hidePlaylists': 'Ocultar playlists',
    'setting.hideSubscriptions': 'Ocultar inscrições',
    'setting.hideEndCards': 'Ocultar telas finais',
    'setting.hideComments': 'Ocultar comentários',
    'setting.hideLiveChat': 'Ocultar chat ao vivo',
    'setting.disableAutoplay': 'Desativar reprodução automática',
    'group.search': 'Resultados de pesquisa',
    'setting.hideShortsSearch': 'Ocultar Shorts do YouTube',
    'group.sidebar': 'Barra lateral do YouTube',
    'setting.hideExplore': 'Ocultar Explorar e Em alta',
    'setting.hideMoreFromYT': 'Ocultar Mais do YouTube',
    'state.lockedinOff': 'LockedIn está desativado',
    'state.breakTimerPrefix': 'Vejo você em',
    'sponsor.title': 'Apoie o LockedIn',
    'sponsor.tagline': 'Se o LockedIn for útil para você, considere fazer uma contribuição.',
    'donation.github.title': 'GitHub Sponsors',
    'donation.github.subtitle': 'Pouca ou nenhuma taxa de plataforma',
    'donation.bmc.title': 'Pague-me um café',
    'donation.bmc.subtitle': 'Apoio simples e único',
    'donation.paypal.title': 'PayPal',
    'donation.paypal.subtitle': 'Pagamentos seguros no mundo todo',
    'donation.upi.title': 'UPI',
    'donation.upi.subtitle': 'Para usuários da Índia',
    'sponsor.review.text': 'Se não puder contribuir financeiramente, adoraria que compartilhasse o LockedIn com amigos ou deixasse uma avaliação nas lojas do Firefox ou Edge.',
    'sponsor.body': `Doe via <a href="https://github.com/sponsors/KartikHalkunde" target="_blank" class="sponsor-link">GitHub Sponsors<svg class="heart-icon" viewBox="0 0 16 16" fill="currentColor"><path d="M4.25 2.5c-1.336 0-2.75 1.164-2.75 3 0 2.15 1.58 4.144 3.365 5.682A20.565 20.565 0 008 13.393a20.561 20.561 0 003.135-2.211C12.92 9.644 14.5 7.65 14.5 5.5c0-1.836-1.414-3-2.75-3-1.373 0-2.609.986-3.029 2.456a.75.75 0 01-1.442 0C6.859 3.486 5.623 2.5 4.25 2.5zM8 14.25l-.345.666-.002-.001-.006-.003-.018-.01a7.643 7.643 0 01-.31-.17 22.075 22.075 0 01-3.434-2.414C2.045 10.731 0 8.35 0 5.5 0 2.836 2.086 1 4.25 1 5.797 1 7.153 1.802 8 3.02 8.847 1.802 10.203 1 11.75 1 13.914 1 16 2.836 16 5.5c0 2.85-2.045 5.231-3.885 6.818a22.08 22.08 0 01-3.744 2.584l-.018.01-.006.003h-.002L8 14.25zm0 0l.345.666a.752.752 0 01-.69 0L8 14.25z"/></svg></a> ou <a href="https://kartikhalkunde.github.io/LockedIn-YT/upi.html" target="_blank" class="sponsor-link">UPI</a> para apoiar meu trabalho.`,
    'sponsor.bodySecondary': `Se não puder contribuir financeiramente, compartilhe o LockedIn com amigos ou deixe uma avaliação no <a href="https://addons.mozilla.org/en-US/firefox/addon/lockedin-yt/?utm_source=addons.mozilla.org&utm_medium=referral&utm_content=search" target="_blank" class="sponsor-link">Firefox</a><br>ou no <a href="https://microsoftedge.microsoft.com/addons/detail/lockedin/hibjbjgfbmhpiaapeccnfddnpabnlklj" target="_blank" class="sponsor-link">MS Edge</a>.`,
    'feedback.title': 'Feedback',
    'feedback.requestHeading': 'Solicite um recurso',
    'feedback.requestText': `Tem uma ideia para deixar o LockedIn ainda melhor? <a href="https://forms.gle/sPsfwB6C16Yx299f9" target="_blank" class="feedback-link-red">Peça aqui.</a>`,
    'feedback.bugHeading': 'Encontrou um erro?',
    'feedback.bugText': `O YouTube atualiza o layout o tempo todo. Se encontrou um bug, <a href="https://forms.gle/9zPoc7yQpDcKD4kP9" target="_blank" class="feedback-link-red">relate aqui.</a>`,
    'footer.sponsor': 'Patrocinar',
    'footer.feedback': 'Feedback',
    'customMeme.tooLarge': 'O arquivo "{filename}" é muito grande. O máximo é 500 KB por imagem.',
    'customMeme.invalidType': 'O arquivo "{filename}" tem um formato inválido. Use PNG, JPG, GIF ou WebP.',
    'customMeme.maxImages': 'São permitidas no máximo 5 imagens. Você já tem {existing} e tentou adicionar {added}.',
    'customMeme.unableUpdate': 'Não foi possível atualizar as imagens personalizadas. Tente novamente.',
    'customMeme.unableSave': 'Não foi possível salvar essas imagens. Tente novamente.'
  },
  fr: {
    'tooltip.menu': 'Menu',
    'tooltip.power': "Activer/désactiver",
    'tooltip.close': 'Fermer',
    'power.instant': 'Désactiver maintenant',
    'power.ten': 'Désactiver pendant 10 min',
    'power.twenty': 'Désactiver pendant 20 min',
    'power.thirty': 'Désactiver pendant 30 min',
    'menu.title': 'Menu',
    'menu.option.hideFeedQuote': 'Masquer les citations motivantes',
    'menu.option.appearance': "Apparence de l’extension",
    'menu.option.language': "Langue de l’extension",
    'menu.option.hideFeedQuote.desc': 'Masque la citation motivante lorsque le fil d’accueil est bloqué.',
    'menu.option.appearance.desc': 'Choisissez le thème Auto, Clair ou Sombre pour le popup.',
    'menu.option.language.desc': 'Définissez la langue du popup ou gardez Auto selon le navigateur.',
    'appearance.option.auto': 'Automatique',
    'appearance.option.light': 'Clair',
    'appearance.option.dark': 'Sombre',
    'language.option.auto': 'Automatique',
    'menu.option.settingsLock': 'Minuteur de verrouillage',
    'menu.option.settingsLock.desc': 'Attendez quelques secondes avant de modifier les réglages à chaque ouverture de LockedIn.',
    'settingsLock.option.off': 'Désactivé',
    'settingsLock.option.seconds': '{seconds} s',
    'menu.option.settingsLockHideCountdown': 'Masquer le compte à rebours',
    'menu.option.settingsLockHideCountdown.desc': 'Masque le temps restant pendant le verrouillage, pour attendre sans savoir combien de temps.',
    'settingsLock.option.minutes': '{minutes} min',
    'settingsLock.title': 'Réglages verrouillés',
    'settingsLock.subtitle': 'Respirez. Avez-vous vraiment besoin de changer quelque chose ?',
    'group.homepage': 'Page d’accueil',
    'group.subscriptionsPage': 'Page des abonnements',
    'setting.hideFeed': 'Masquer le flux d’accueil',
    'setting.redirectToSubs': 'Rediriger vers Abonnements',
    'setting.hideMostRelevant': "Masquer 'Les plus pertinents'",
    'setting.hideSubsLiveStreams': 'Masquer les streams en direct',
    'setting.hideShortsHomepage': 'Masquer les YouTube Shorts',
    'setting.hideExploreMoreTopics': 'Masquer Explorer plus de themes',
    'setting.cleanHomepageFeed': 'Nettoyer le fil d\'accueil',
    'setting.hideCommunityPosts': 'Masquer les publications de la communauté',
    'setting.cleanSidebar': 'Nettoyer la barre latérale',
    'setting.hideFeaturedContent': 'Masquer le contenu en vedette',
    'setting.hideMembersOnly': 'Masquer le contenu réservé aux membres',
    'group.shorts': 'YouTube Shorts',
    'setting.hideShortsGlobal': 'Masquer Shorts (toutes les pages)',
    'setting.redirectShorts': 'Rediriger les Shorts',
    'group.thumbnails': 'Miniatures',
    'setting.hideVideoThumbnails': 'Masquer les miniatures',
    'thumbnail.disable': 'Désactiver',
    'thumbnail.blur': 'Flou',
    'thumbnail.hidden': 'Masqué',
    'thumbnail.revealOnHover': 'Révéler au survol',
    'thumbnail.solidColor': 'Couleur unie',
    'group.video': 'Page vidéo',
    'setting.hideSidebar': 'Masquer la barre latérale',
    'setting.hideRecommended': 'Masquer les vidéos recommandées',
    'setting.hideSidebarShorts': 'Masquer les YouTube Shorts',
    'setting.hidePlaylists': 'Masquer les playlists',
    'setting.hideSubscriptions': 'Masquer les abonnements',
    'setting.hideEndCards': 'Masquer les écrans de fin',
    'setting.hideComments': 'Masquer les commentaires',
    'setting.hideLiveChat': 'Masquer le chat en direct',
    'setting.disableAutoplay': 'Désactiver la lecture auto',
    'group.search': 'Résultats de recherche',
    'setting.hideShortsSearch': 'Masquer les YouTube Shorts',
    'group.sidebar': 'Barre latérale YouTube',
    'setting.hideExplore': 'Masquer Explorer et Tendances',
    'setting.hideMoreFromYT': 'Masquer Plus de YouTube',
    'state.lockedinOff': 'LockedIn est désactivé',
    'state.breakTimerPrefix': 'À bientôt dans',
    'sponsor.title': 'Soutenir LockedIn',
    'sponsor.tagline': 'Si LockedIn vous est utile, pensez à faire une contribution.',
    'donation.github.title': 'GitHub Sponsors',
    'donation.github.subtitle': 'Peu ou pas de frais de plateforme',
    'donation.bmc.title': 'Offrez-moi un café',
    'donation.bmc.subtitle': 'Soutien simple et ponctuel',
    'donation.paypal.title': 'PayPal',
    'donation.paypal.subtitle': 'Paiements sécurisés dans le monde entier',
    'donation.upi.title': 'UPI',
    'donation.upi.subtitle': 'Pour les utilisateurs en Inde',
    'sponsor.review.text': 'Si vous ne pouvez pas contribuer financièrement, partagez LockedIn avec des amis ou laissez un avis sur les stores Firefox ou Edge.',
    'sponsor.body': `Faites un don via <a href="https://github.com/sponsors/KartikHalkunde" target="_blank" class="sponsor-link">GitHub Sponsors<svg class="heart-icon" viewBox="0 0 16 16" fill="currentColor"><path d="M4.25 2.5c-1.336 0-2.75 1.164-2.75 3 0 2.15 1.58 4.144 3.365 5.682A20.565 20.565 0 008 13.393a20.561 20.561 0 003.135-2.211C12.92 9.644 14.5 7.65 14.5 5.5c0-1.836-1.414-3-2.75-3-1.373 0-2.609.986-3.029 2.456a.75.75 0 01-1.442 0C6.859 3.486 5.623 2.5 4.25 2.5zM8 14.25l-.345.666-.002-.001-.006-.003-.018-.01a7.643 7.643 0 01-.31-.17 22.075 22.075 0 01-3.434-2.414C2.045 10.731 0 8.35 0 5.5 0 2.836 2.086 1 4.25 1 5.797 1 7.153 1.802 8 3.02 8.847 1.802 10.203 1 11.75 1 13.914 1 16 2.836 16 5.5c0 2.85-2.045 5.231-3.885 6.818a22.08 22.08 0 01-3.744 2.584l-.018.01-.006.003h-.002L8 14.25zm0 0l.345.666a.752.752 0 01-.69 0L8 14.25z"/></svg></a> ou <a href="https://kartikhalkunde.github.io/LockedIn-YT/upi.html" target="_blank" class="sponsor-link">UPI</a> pour soutenir mon travail.`,
    'sponsor.bodySecondary': `Si vous ne pouvez pas contribuer financièrement, merci de partager LockedIn avec vos amis ou de laisser un avis sur <a href="https://addons.mozilla.org/en-US/firefox/addon/lockedin-yt/?utm_source=addons.mozilla.org&utm_medium=referral&utm_content=search" target="_blank" class="sponsor-link">Firefox</a><br>ou <a href="https://microsoftedge.microsoft.com/addons/detail/lockedin/hibjbjgfbmhpiaapeccnfddnpabnlklj" target="_blank" class="sponsor-link">MS Edge</a>.`,
    'feedback.title': 'Retour',
    'feedback.requestHeading': 'Demander une fonctionnalité',
    'feedback.requestText': `Une idée pour améliorer LockedIn ? <a href="https://forms.gle/sPsfwB6C16Yx299f9" target="_blank" class="feedback-link-red">Demandez-la ici.</a>`,
    'feedback.bugHeading': 'Vous avez trouvé un bug ?',
    'feedback.bugText': `YouTube modifie sans cesse son interface. Si vous trouvez un bug, <a href="https://forms.gle/9zPoc7yQpDcKD4kP9" target="_blank" class="feedback-link-red">signalez-le ici.</a>`,
    'footer.sponsor': 'Soutenir',
    'footer.feedback': 'Retour',
    'customMeme.tooLarge': 'Le fichier "{filename}" est trop volumineux. Taille maximale : 500 Ko par image.',
    'customMeme.invalidType': 'Le fichier "{filename}" a un format non valide. Utilisez PNG, JPG, GIF ou WebP.',
    'customMeme.maxImages': 'Maximum 5 images autorisées. Vous en avez déjà {existing} et avez tenté d’en ajouter {added}.',
    'customMeme.unableUpdate': 'Impossible de mettre à jour les images personnalisées. Réessayez.',
    'customMeme.unableSave': 'Impossible d’enregistrer ces images. Réessayez.'
  },
  de: {
    'tooltip.menu': 'Menü',
    'tooltip.power': 'Erweiterung umschalten',
    'tooltip.close': 'Schließen',
    'power.instant': 'Jetzt deaktivieren',
    'power.ten': 'Für 10 Min deaktivieren',
    'power.twenty': 'Für 20 Min deaktivieren',
    'power.thirty': 'Für 30 Min deaktivieren',
    'menu.title': 'Menü',
    'menu.option.hideFeedQuote': 'Motivationszitate ausblenden',
    'menu.option.appearance': 'Aussehen der Erweiterung',
    'menu.option.language': 'Sprache der Erweiterung',
    'menu.option.hideFeedQuote.desc': 'Blendet das Motivationszitat aus, wenn der Startseiten-Feed blockiert ist.',
    'menu.option.appearance.desc': 'Wähle Auto-, Hell- oder Dunkel-Design für das Popup.',
    'menu.option.language.desc': 'Lege die Popup-Sprache fest oder nutze Auto für die Browser-Sprache.',
    'appearance.option.auto': 'Automatisch',
    'appearance.option.light': 'Hell',
    'appearance.option.dark': 'Dunkel',
    'language.option.auto': 'Automatisch',
    'menu.option.settingsLock': 'Einstellungssperre',
    'menu.option.settingsLock.desc': 'Warte bei jedem Öffnen von LockedIn ein paar Sekunden, bevor du Einstellungen ändern kannst.',
    'settingsLock.option.off': 'Aus',
    'settingsLock.option.seconds': '{seconds} s',
    'menu.option.settingsLockHideCountdown': 'Countdown ausblenden',
    'menu.option.settingsLockHideCountdown.desc': 'Blendet die verbleibende Zeit während der Sperre aus, sodass du wartest, ohne zu wissen, wie lange.',
    'settingsLock.option.minutes': '{minutes} Min.',
    'settingsLock.title': 'Einstellungen gesperrt',
    'settingsLock.subtitle': 'Atme durch. Musst du wirklich etwas ändern?',
    'group.homepage': 'Startseite',
    'group.subscriptionsPage': 'Abonnementseite',
    'setting.hideFeed': 'Startseiten-Feed ausblenden',
    'setting.redirectToSubs': 'Zu Abos umleiten',
    'setting.hideMostRelevant': "'Relevanteste' ausblenden",
    'setting.hideSubsLiveStreams': 'Livestreams ausblenden',
    'setting.hideShortsHomepage': 'YouTube Shorts ausblenden',
    'setting.hideExploreMoreTopics': 'Mehr Themen entdecken ausblenden',
    'setting.cleanHomepageFeed': 'Startseiten-Feed bereinigen',
    'setting.hideCommunityPosts': 'Community-Beiträge ausblenden',
    'setting.cleanSidebar': 'Seitenleiste bereinigen',
    'setting.hideFeaturedContent': 'Hervorgehobene Inhalte ausblenden',
    'setting.hideMembersOnly': 'Mitgliederinhalte ausblenden',
    'group.shorts': 'YouTube Shorts',
    'setting.hideShortsGlobal': 'Shorts ausblenden (alle Seiten)',
    'setting.redirectShorts': 'Shorts umleiten',
    'group.thumbnails': 'Vorschaubilder',
    'setting.hideVideoThumbnails': 'Vorschaubilder ausblenden',
    'thumbnail.disable': 'Deaktivieren',
    'thumbnail.blur': 'Unschärfe',
    'thumbnail.hidden': 'Versteckt',
    'thumbnail.revealOnHover': 'Bei Hover anzeigen',
    'thumbnail.solidColor': 'Einfarbig',
    'group.video': 'Videoseite',
    'setting.hideSidebar': 'Videoseitenleiste ausblenden',
    'setting.hideRecommended': 'Empfohlene Videos ausblenden',
    'setting.hideSidebarShorts': 'YouTube Shorts ausblenden',
    'setting.hidePlaylists': 'Playlists ausblenden',
    'setting.hideSubscriptions': 'Abonnements ausblenden',
    'setting.hideEndCards': 'Endkarten ausblenden',
    'setting.hideComments': 'Kommentare ausblenden',
    'setting.hideLiveChat': 'Livechat ausblenden',
    'setting.disableAutoplay': 'Autoplay deaktivieren',
    'group.search': 'Suchergebnisse',
    'setting.hideShortsSearch': 'YouTube Shorts ausblenden',
    'group.sidebar': 'YouTube-Seitenleiste',
    'setting.hideExplore': 'Explore & Trends ausblenden',
    'setting.hideMoreFromYT': 'Mehr von YouTube ausblenden',
    'state.lockedinOff': 'LockedIn ist deaktiviert',
    'state.breakTimerPrefix': 'Bis gleich in',
    'sponsor.title': 'LockedIn unterstützen',
    'sponsor.tagline': 'Wenn dir LockedIn hilft, erwäge bitte eine Unterstützung.',
    'donation.github.title': 'GitHub Sponsors',
    'donation.github.subtitle': 'Geringe oder keine Plattformgebühr',
    'donation.bmc.title': 'Spendier mir einen Kaffee',
    'donation.bmc.subtitle': 'Einfacher einmaliger Support',
    'donation.paypal.title': 'PayPal',
    'donation.paypal.subtitle': 'Sichere Zahlungen weltweit',
    'donation.upi.title': 'UPI',
    'donation.upi.subtitle': 'Für Nutzer in Indien',
    'sponsor.review.text': 'Wenn du finanziell nicht unterstützen kannst, teile LockedIn mit Freunden oder hinterlasse eine Bewertung im Firefox- oder Edge-Store.',
    'sponsor.body': `Spende über <a href="https://github.com/sponsors/KartikHalkunde" target="_blank" class="sponsor-link">GitHub Sponsors<svg class="heart-icon" viewBox="0 0 16 16" fill="currentColor"><path d="M4.25 2.5c-1.336 0-2.75 1.164-2.75 3 0 2.15 1.58 4.144 3.365 5.682A20.565 20.565 0 008 13.393a20.561 20.561 0 003.135-2.211C12.92 9.644 14.5 7.65 14.5 5.5c0-1.836-1.414-3-2.75-3-1.373 0-2.609.986-3.029 2.456a.75.75 0 01-1.442 0C6.859 3.486 5.623 2.5 4.25 2.5zM8 14.25l-.345.666-.002-.001-.006-.003-.018-.01a7.643 7.643 0 01-.31-.17 22.075 22.075 0 01-3.434-2.414C2.045 10.731 0 8.35 0 5.5 0 2.836 2.086 1 4.25 1 5.797 1 7.153 1.802 8 3.02 8.847 1.802 10.203 1 11.75 1 13.914 1 16 2.836 16 5.5c0 2.85-2.045 5.231-3.885 6.818a22.08 22.08 0 01-3.744 2.584l-.018.01-.006.003h-.002L8 14.25zm0 0l.345.666a.752.752 0 01-.69 0L8 14.25z"/></svg></a> oder <a href="https://kartikhalkunde.github.io/LockedIn-YT/upi.html" target="_blank" class="sponsor-link">UPI</a>, um meine Arbeit zu unterstützen.`,
    'sponsor.bodySecondary': `Wenn du finanziell nicht helfen kannst, teile LockedIn mit Freunden oder hinterlasse eine Bewertung im <a href="https://addons.mozilla.org/en-US/firefox/addon/lockedin-yt/?utm_source=addons.mozilla.org&utm_medium=referral&utm_content=search" target="_blank" class="sponsor-link">Firefox</a><br>oder im <a href="https://microsoftedge.microsoft.com/addons/detail/lockedin/hibjbjgfbmhpiaapeccnfddnpabnlklj" target="_blank" class="sponsor-link">MS Edge</a>-Store.`,
    'feedback.title': 'Feedback',
    'feedback.requestHeading': 'Funktion anfragen',
    'feedback.requestText': `Hast du eine Idee, um LockedIn zu verbessern? <a href="https://forms.gle/sPsfwB6C16Yx299f9" target="_blank" class="feedback-link-red">Fordere sie hier an.</a>`,
    'feedback.bugHeading': 'Fehler gefunden?',
    'feedback.bugText': `YouTube ändert ständig das Layout. Wenn du einen Fehler gefunden hast, <a href="https://forms.gle/9zPoc7yQpDcKD4kP9" target="_blank" class="feedback-link-red">melde ihn hier.</a>`,
    'footer.sponsor': 'Unterstützen',
    'footer.feedback': 'Feedback',
    'customMeme.tooLarge': 'Die Datei "{filename}" ist zu groß. Maximal 500 KB pro Bild.',
    'customMeme.invalidType': 'Die Datei "{filename}" hat ein ungültiges Format. Verwende PNG, JPG, GIF oder WebP.',
    'customMeme.maxImages': 'Es sind höchstens 5 Bilder erlaubt. Du hast bereits {existing} und wolltest {added} hinzufügen.',
    'customMeme.unableUpdate': 'Benutzerdefinierte Bilder konnten nicht aktualisiert werden. Bitte erneut versuchen.',
    'customMeme.unableSave': 'Diese Bilder konnten nicht gespeichert werden. Bitte erneut versuchen.'
  },
  'zh-CN': {
    'tooltip.menu': '菜单',
    'tooltip.power': '扩展开关',
    'tooltip.close': '关闭',
    'power.instant': '立即关闭',
    'power.ten': '关闭10分钟',
    'power.twenty': '关闭20分钟',
    'power.thirty': '关闭30分钟',
    'menu.title': '菜单',
    'menu.option.hideFeedQuote': '隐藏励志语录',
    'menu.option.appearance': '扩展外观',
    'menu.option.language': '扩展语言',
    'menu.option.hideFeedQuote.desc': '在首页信息流被屏蔽时隐藏显示的励志语录。',
    'menu.option.appearance.desc': '为扩展弹窗选择自动、浅色或深色主题。',
    'menu.option.language.desc': '手动设置弹窗语言，或保持自动以跟随浏览器语言。',
    'appearance.option.auto': '自动',
    'appearance.option.light': '浅色',
    'appearance.option.dark': '深色',
    'language.option.auto': '自动',
    'menu.option.settingsLock': '设置锁定计时器',
    'menu.option.settingsLock.desc': '每次打开 LockedIn 时，需等待几秒才能更改设置。',
    'settingsLock.option.off': '关闭',
    'settingsLock.option.seconds': '{seconds}秒',
    'menu.option.settingsLockHideCountdown': '隐藏倒计时',
    'menu.option.settingsLockHideCountdown.desc': '设置锁定时隐藏剩余时间，让你不知道还要等多久。',
    'settingsLock.option.minutes': '{minutes}分钟',
    'settingsLock.title': '设置已锁定',
    'settingsLock.subtitle': '深呼吸。你真的需要更改什么吗？',
    'group.homepage': '主页',
    'group.subscriptionsPage': '订阅页面',
    'setting.hideFeed': '隐藏首页信息流',
    'setting.redirectToSubs': '重定向到订阅页',
    'setting.hideMostRelevant': "隐藏“最相关”",
    'setting.hideSubsLiveStreams': '隐藏直播',
    'setting.hideShortsHomepage': '隐藏 YouTube Shorts',
    'setting.hideExploreMoreTopics': '隐藏“探索更多主题”',
    'setting.cleanHomepageFeed': '清理首页信息流',
    'setting.hideCommunityPosts': '隐藏社区帖子',
    'setting.cleanSidebar': '清理侧边栏',
    'setting.hideFeaturedContent': '隐藏精选内容',
    'setting.hideMembersOnly': '隐藏会员专属内容',
    'setting.hidePlayables': '隐藏 YouTube 小游戏',
      'group.shorts': 'YouTube Shorts',
    'setting.hideShortsGlobal': '隐藏 Shorts(所有页面)',
    'setting.redirectShorts': '重定向 Shorts',
    'group.thumbnails': '缩略图',
    'setting.hideVideoThumbnails': '隐藏缩略图',
    'thumbnail.disable': '禁用',
    'thumbnail.blur': '模糊',
    'thumbnail.hidden': '隐藏',
    'thumbnail.revealOnHover': '悬停显示',
    'thumbnail.solidColor': '纯色',
    'group.video': '视频页面',
    'setting.hideSidebar': '隐藏视频侧边栏',
    'setting.hideRecommended': '隐藏推荐视频',
    'setting.hideSidebarShorts': '隐藏 Shorts',
    'setting.hidePlaylists': '隐藏播放列表',
    'setting.hideSubscriptions': '隐藏订阅内容',
    'setting.hideEndCards': '隐藏结束画面卡片',
    'setting.hideComments': '隐藏评论',
    'setting.hideLiveChat': '隐藏直播聊天',
    'setting.disableAutoplay': '关闭自动播放',
    'group.search': '搜索结果',
    'setting.hideShortsSearch': '隐藏 YouTube 短视频',
    'group.sidebar': 'YouTube 侧边栏',
    'setting.hideExplore': '隐藏探索与趋势',
    'setting.hideMoreFromYT': '隐藏更多 YouTube 内容',
    'state.lockedinOff': 'LockedIn 已关闭',
    'state.breakTimerPrefix': '将在以下时间后回来：',
    'sponsor.title': '支持 LockedIn',
      'sponsor.body': `通过 <a href="https://github.com/sponsors/KartikHalkunde" target="_blank" class="sponsor-link">GitHub Sponsors<svg class="heart-icon" viewBox="0 0 16 16" fill="currentColor"><path d="M4.25 2.5c-1.336 0-2.75 1.164-2.75 3 0 2.15 1.58 4.144 3.365 5.682A20.565 20.565 0 008 13.393a20.561 20.561 0 003.135-2.211C12.92 9.644 14.5 7.65 14.5 5.5c0-1.836-1.414-3-2.75-3-1.373 0-2.609.986-3.029 2.456a.75.75 0 01-1.442 0C6.859 3.486 5.623 2.5 4.25 2.5zM8 14.25l-.345.666-.002-.001-.006-.003-.018-.01a7.643 7.643 0 01-.31-.17 22.075 22.075 0 01-3.434-2.414C2.045 10.731 0 8.35 0 5.5 0 2.836 2.086 1 4.25 1 5.797 1 7.153 1.802 8 3.02 8.847 1.802 10.203 1 11.75 1 13.914 1 16 2.836 16 5.5c0 2.85-2.045 5.231-3.885 6.818a22.08 22.08 0 01-3.744 2.584l-.018.01-.006.003h-.002L8 14.25zm0 0l.345.666a.752.752 0 01-.69 0L8 14.25z"/></svg></a> 或 <a href="https://kartikhalkunde.github.io/LockedIn-YT/upi.html" target="_blank" class="sponsor-link">UPI</a> 捐赠以支持开发者.`,
    'sponsor.bodySecondary': `如果无法进行资金支持，也可以分享 LockedIn 给朋友，或在 <a href="https://addons.mozilla.org/en-US/firefox/addon/lockedin-yt/?utm_source=addons.mozilla.org&utm_medium=referral&utm_content=search" target="_blank" class="sponsor-link">Firefox</a><br>或 <a href="https://microsoftedge.microsoft.com/addons/detail/lockedin/hibjbjgfbmhpiaapeccnfddnpabnlklj" target="_blank" class="sponsor-link">Edge</a> 上留下评价。`,
    'feedback.title': '反馈',
    'feedback.requestHeading': '功能建议',
    'feedback.requestText': `如果你有让 LockedIn 更好的想法，可以 <a href="https://forms.gle/sPsfwB6C16Yx299f9" target="_blank" class="feedback-link-red">在这里提交</a>。`,
    'feedback.bugHeading': '发现 Bug？',
    'feedback.bugText': `YouTube 经常更新界面，如果你发现问题，可以 <a href="https://forms.gle/9zPoc7yQpDcKD4kP9" target="_blank" class="feedback-link-red">在这里报告</a>`,
    'footer.sponsor': '赞助',
    'footer.feedback': '反馈',
    'customMeme.tooLarge': '文件“{filename}”过大！每张图片最大 500KB。',
    'customMeme.invalidType': '文件“{filename}”类型无效！请使用 PNG、JPG、GIF 或 WebP。',
    'customMeme.maxImages': '最多允许 5 张图片！当前已有 {existing} 张，尝试添加 {added} 张。',
    'customMeme.unableUpdate': '无法更新自定义图片，请重试。',
    'customMeme.unableSave': '无法保存这些图片，请重试。',
    'customMeme.unableSave': '無法保存這些圖片，請重試。',
    'sponsor.tagline': '如果你觉得 LockedIn 有帮助，请考虑贡献支持。',
    'donation.github.title': 'GitHub 赞助',
    'donation.github.subtitle': '几乎无平台手续费',
    'donation.bmc.title': '请我喝杯咖啡',
    'donation.bmc.subtitle': '简单的一次性支持',
    'donation.paypal.title': 'PayPal',
    'donation.paypal.subtitle': '全球安全支付',
    'donation.upi.title': 'UPI',
    'donation.upi.subtitle': '适用于印度用户',
    'sponsor.review.text': '如果无法经济支持，希望你能将 LockedIn 分享给朋友，或在 Firefox 和 Edge 商店留下好评。'
  },
  'zh-TW': {
    'tooltip.menu': '菜單',
    'tooltip.power': '擴展開關',
    'tooltip.close': '關閉',
    'power.instant': '立即關閉',
    'power.ten': '關閉10分鐘',
    'power.twenty': '關閉20分鐘',
    'power.thirty': '關閉30分鐘',
    'menu.title': '菜單',
    'menu.option.hideFeedQuote': '隱藏勵志語錄',
    'menu.option.appearance': '擴展外觀',
    'menu.option.language': '擴展語言',
    'menu.option.hideFeedQuote.desc': '在首頁信息流被屏蔽時隱藏顯示的勵志語錄。',
    'menu.option.appearance.desc': '爲擴展彈窗選擇自動、淺色或深色主題。',
    'menu.option.language.desc': '手動設置彈窗語言，或保持自動以跟隨瀏覽器語言。',
    'appearance.option.auto': '自動',
    'appearance.option.light': '淺色',
    'appearance.option.dark': '深色',
    'language.option.auto': '自動',
    'menu.option.settingsLock': '設定鎖定計時器',
    'menu.option.settingsLock.desc': '每次開啟 LockedIn 時，需等待幾秒才能更改設定。',
    'settingsLock.option.off': '關閉',
    'settingsLock.option.seconds': '{seconds}秒',
    'menu.option.settingsLockHideCountdown': '隱藏倒數計時',
    'menu.option.settingsLockHideCountdown.desc': '設定鎖定時隱藏剩餘時間，讓你不知道還要等多久。',
    'settingsLock.option.minutes': '{minutes}分鐘',
    'settingsLock.title': '設定已鎖定',
    'settingsLock.subtitle': '深呼吸。你真的需要更改什麼嗎？',
    'group.homepage': '主頁',
    'group.subscriptionsPage': '訂閱頁面',
    'setting.hideFeed': '隱藏首頁信息流',
    'setting.redirectToSubs': '重定向到訂閱頁',
    'setting.hideMostRelevant': "隱藏“最相關”",
    'setting.hideSubsLiveStreams': '隱藏直播',
    'setting.hideShortsHomepage': '隱藏 YouTube Shorts',
    'setting.hideExploreMoreTopics': '隱藏“探索更多主題”',
    'setting.cleanHomepageFeed': '清理首頁信息流',
    'setting.hideCommunityPosts': '隱藏社區帖子',
    'setting.cleanSidebar': '清理側邊欄',
    'setting.hideFeaturedContent': '隱藏精選內容',
    'setting.hideMembersOnly': '隱藏會員專屬內容',
    'setting.hidePlayables': '隱藏 YouTube 小遊戲',
      'group.shorts': 'YouTube Shorts',
    'setting.hideShortsGlobal': '隱藏 Shorts(所有頁面)',
    'setting.redirectShorts': '重定向 Shorts',
    'group.thumbnails': '縮略圖',
    'setting.hideVideoThumbnails': '隱藏縮略圖',
    'thumbnail.disable': '禁用',
    'thumbnail.blur': '模糊',
    'thumbnail.hidden': '隱藏',
    'thumbnail.revealOnHover': '懸停顯示',
    'thumbnail.solidColor': '純色',
    'group.video': '視頻頁面',
    'setting.hideSidebar': '隱藏視頻側邊欄',
    'setting.hideRecommended': '隱藏推薦視頻',
    'setting.hideSidebarShorts': '隱藏 Shorts',
    'setting.hidePlaylists': '隱藏播放列表',
    'setting.hideSubscriptions': '隱藏訂閱內容',
    'setting.hideEndCards': '隱藏結束畫面卡片',
    'setting.hideComments': '隱藏評論',
    'setting.hideLiveChat': '隱藏直播聊天',
    'setting.disableAutoplay': '關閉自動播放',
    'group.search': '搜索結果',
    'setting.hideShortsSearch': '隱藏 YouTube 短視頻',
    'group.sidebar': 'YouTube 側邊欄',
    'setting.hideExplore': '隱藏探索與趨勢',
    'setting.hideMoreFromYT': '隱藏更多 YouTube 內容',
    'state.lockedinOff': 'LockedIn 已關閉',
    'state.breakTimerPrefix': '將在以下時間後回來：',
    'sponsor.title': '支持 LockedIn',
      'sponsor.body': `通過 <a href="https://github.com/sponsors/KartikHalkunde" target="_blank" class="sponsor-link">GitHub Sponsors<svg class="heart-icon" viewBox="0 0 16 16" fill="currentColor"><path d="M4.25 2.5c-1.336 0-2.75 1.164-2.75 3 0 2.15 1.58 4.144 3.365 5.682A20.565 20.565 0 008 13.393a20.561 20.561 0 003.135-2.211C12.92 9.644 14.5 7.65 14.5 5.5c0-1.836-1.414-3-2.75-3-1.373 0-2.609.986-3.029 2.456a.75.75 0 01-1.442 0C6.859 3.486 5.623 2.5 4.25 2.5zM8 14.25l-.345.666-.002-.001-.006-.003-.018-.01a7.643 7.643 0 01-.31-.17 22.075 22.075 0 01-3.434-2.414C2.045 10.731 0 8.35 0 5.5 0 2.836 2.086 1 4.25 1 5.797 1 7.153 1.802 8 3.02 8.847 1.802 10.203 1 11.75 1 13.914 1 16 2.836 16 5.5c0 2.85-2.045 5.231-3.885 6.818a22.08 22.08 0 01-3.744 2.584l-.018.01-.006.003h-.002L8 14.25zm0 0l.345.666a.752.752 0 01-.69 0L8 14.25z"/></svg></a> 或 <a href="https://kartikhalkunde.github.io/LockedIn-YT/upi.html" target="_blank" class="sponsor-link">UPI</a> 捐贈以支持開發者.`,
    'sponsor.bodySecondary': `如果無法進行資金支持，也可以分享 LockedIn 給朋友，或在 <a href="https://addons.mozilla.org/en-US/firefox/addon/lockedin-yt/?utm_source=addons.mozilla.org&utm_medium=referral&utm_content=search" target="_blank" class="sponsor-link">Firefox</a><br>或 <a href="https://microsoftedge.microsoft.com/addons/detail/lockedin/hibjbjgfbmhpiaapeccnfddnpabnlklj" target="_blank" class="sponsor-link">Edge</a> 上留下評價。`,
    'feedback.title': '反饋',
    'feedback.requestHeading': '功能建議',
    'feedback.requestText': `如果你有讓 LockedIn 更好的想法，可以 <a href="https://forms.gle/sPsfwB6C16Yx299f9" target="_blank" class="feedback-link-red">在這裏提交</a>。`,
    'feedback.bugHeading': '發現 Bug？',
    'feedback.bugText': `YouTube 經常更新界面，如果你發現問題，可以 <a href="https://forms.gle/9zPoc7yQpDcKD4kP9" target="_blank" class="feedback-link-red">在這裏報告</a>`,
    'footer.sponsor': '贊助',
    'footer.feedback': '反饋',
    'customMeme.tooLarge': '文件“{filename}”過大！每張圖片最大 500KB。',
    'customMeme.invalidType': '文件“{filename}”類型無效！請使用 PNG、JPG、GIF 或 WebP。',
    'customMeme.maxImages': '最多允許 5 張圖片！當前已有 {existing} 張，嘗試添加 {added} 張。',
    'customMeme.unableUpdate': '無法更新自定義圖片，請重試。',
    'customMeme.unableSave': '無法保存這些圖片，請重試。',
    'sponsor.tagline': '如果你覺得 LockedIn 有幫助，請考慮貢獻支持。',
    'donation.github.title': 'GitHub 贊助',
    'donation.github.subtitle': '幾乎無平臺手續費',
    'donation.bmc.title': '請我喝杯咖啡',
    'donation.bmc.subtitle': '簡單的一次性支持',
    'donation.paypal.title': 'PayPal',
    'donation.paypal.subtitle': '全球安全支付',
    'donation.upi.title': 'UPI',
    'donation.upi.subtitle': '適用於印度用戶',
    'sponsor.review.text': '如果無法經濟支持，希望你能將 LockedIn 分享給朋友，或在 Firefox 和 Edge 商店留下好評。'
  }
};

let activeLanguage = FALLBACK_LANGUAGE;
let currentAppearanceValue = 'auto';
let currentLanguagePreference = 'auto';
let currentThumbnailMode = 'off';
let currentSettingsLockDuration = 0;

function normalizeThumbnailMode(value) {
  if (value === true) return 'reveal-on-hover';
  if (value === false || value === null || value === undefined) return 'off';
  if (THUMBNAIL_MODE_OPTIONS.includes(value)) return value;
  return 'off';
}

function updateThumbnailModeUI(mode) {
  const normalizedMode = normalizeThumbnailMode(mode);
  currentThumbnailMode = normalizedMode;
  const display = document.getElementById('thumbnailModeDisplay');
  const modeButton = document.getElementById('thumbnailModeButton');
  const options = document.querySelectorAll('.thumbnail-dropdown-option');
  if (display) {
    const key = THUMBNAIL_MODE_LABEL_KEYS[normalizedMode] || THUMBNAIL_MODE_LABEL_KEYS.off;
    const fallback = THUMBNAIL_MODE_FALLBACK_LABELS[normalizedMode] || THUMBNAIL_MODE_FALLBACK_LABELS.off;
    display.textContent = translate(key, null, activeLanguage) || fallback;
  }
  if (modeButton) {
    modeButton.dataset.mode = normalizedMode;
  }
  options.forEach((option) => {
    option.classList.toggle('selected', option.dataset.mode === normalizedMode);
  });
}

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
  const exactMatch = SUPPORTED_LANGUAGES.find(code => browserLang === code.toLowerCase());
  if (exactMatch) return exactMatch;

  if (browserLang.startsWith('zh-')) {
    if (/^zh-(hant|tw|hk|mo)/.test(browserLang)) {
      return 'zh-TW';
    }
    return 'zh-CN';
  }

  if (browserLang === 'zh') {
    return 'zh-CN';
  }

  const partialMatch = SUPPORTED_LANGUAGES.find(
    code => browserLang.startsWith(code.toLowerCase() + '-')
  );
  return partialMatch || FALLBACK_LANGUAGE;
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

function applyTranslations(languageCode) {
  const normalized = SUPPORTED_LANGUAGES.includes(languageCode) ? languageCode : FALLBACK_LANGUAGE;
  activeLanguage = normalized;
  document.documentElement.setAttribute('lang', normalized);

  const elements = document.querySelectorAll('[data-i18n-key]');
  elements.forEach((el) => {
    const key = el.dataset.i18nKey;
    if (!key) return;

    const attr = el.dataset.i18nAttr;
    const type = el.dataset.i18nType;
    const value = translate(key, null, normalized);
    if (!value) return;

    if (attr) {
      el.setAttribute(attr, value);
    } else if (type === 'html') {
      // 1. Clear existing content
      el.textContent = '';

      // 2. Use DOMParser to parse the string into a temporary document
      // This avoids using the forbidden ".innerHTML" property entirely
      const parser = new DOMParser();
      const doc = parser.parseFromString(value, 'text/html');

      // 3. Move the parsed nodes into your element
      const nodes = Array.from(doc.body.childNodes);
      nodes.forEach(node => {
        // Clone the node to move it from the temporary doc to the popup
        el.appendChild(document.importNode(node, true));
      });
    } else {
      el.textContent = value;
    }
  });
}

// ===== INITIALIZATION =====
document.addEventListener('DOMContentLoaded', () => {
  setupSettingsLock();
  displayVersion();
  setupToggleListeners();
  setupGroupCollapsibles();
  setupThumbnailModeDropdown();
  setupPowerButton();
  setupMenuButton();
  setupFeedbackButton();
  setupSponsorButton();
  setupCustomMemeUpload();
  setupBreakTimer();
  updateHeaderVisibility();

  loadSettings().catch((error) => {
    console.error('LockedIn: Failed to load popup settings', error);
  });
});

function setupGroupCollapsibles() {
  const groups = document.querySelectorAll('.settings-group');
  const popupContainer = document.querySelector('.popup-container');

  if (popupContainer) {
    popupContainer.classList.add('collapse-state-restoring');
  }

  browser.storage.sync.get(['collapsedGroups'], (result) => {
    const saved = result.collapsedGroups || {};

    groups.forEach((group) => {
      const header = group.querySelector('.group-header');
      const chevron = group.querySelector('.group-chevron');
      if (!header || !chevron) return;

      const groupKey = group.dataset.group || header.textContent.trim();

      const setCollapsed = (collapsed, persist = false) => {
        group.classList.toggle('collapsed', collapsed);
        chevron.setAttribute('aria-expanded', collapsed ? 'false' : 'true');
        if (persist) {
          saved[groupKey] = collapsed;
          browser.storage.sync.set({ collapsedGroups: saved });
        }
      };

      group.classList.add('collapse-state-restoring');
      setCollapsed(!!saved[groupKey], false);

      chevron.addEventListener('click', () => {
        const isCollapsed = group.classList.contains('collapsed');
        setCollapsed(!isCollapsed, true);
      });
    });

    requestAnimationFrame(() => {
      groups.forEach((group) => group.classList.remove('collapse-state-restoring'));
      if (popupContainer) {
        popupContainer.classList.remove('collapse-state-restoring');
      }
    });
  });
}

// ===== VERSION DISPLAY =====
function displayVersion() {
  const versionElement = document.querySelector('.version');
  if (versionElement) {
    versionElement.textContent = `v.1.2.2`;
    versionElement.setAttribute('aria-label', `Version 1.2.2`);
  }
}

// ===== MENU BUTTON (Hamburger) =====
function setupMenuButton() {
  const menuButton = document.getElementById('menuButton');
  const closeMenuButton = document.getElementById('closeMenuButton');
  const settingsMenu = document.getElementById('settingsMenu');

  menuButton.addEventListener('click', () => {
    const isOpen = settingsMenu.classList.contains('open');
    if (isOpen) {
      settingsMenu.classList.remove('open');
      menuButton.classList.remove('open');
      closeThumbnailDropdown();
      closeMenuInlineDropdowns();
    } else {
      closePowerDropdown();
      closeThumbnailDropdown();
      closeMenuInlineDropdowns();
      settingsMenu.classList.add('open');
      menuButton.classList.add('open');
    }
    updateHeaderVisibility();
  });

  closeMenuButton.addEventListener('click', () => {
    settingsMenu.classList.remove('open');
    menuButton.classList.remove('open');
    closeThumbnailDropdown();
    closeMenuInlineDropdowns();
    updateHeaderVisibility();
  });
}

// ===== FEEDBACK BUTTON =====
function setupFeedbackButton() {
  const feedbackButton = document.getElementById('feedbackButton');
  if (feedbackButton) {
    feedbackButton.addEventListener('click', () => {
      browser.tabs.create({ url: 'https://github.com/KartikHalkunde/LockedIn-YT/issues' });
    });
  }
}

// ===== SPONSOR BUTTON =====
function setupSponsorButton() {
  const sponsorButton = document.getElementById('sponsorButton');
  const closeSponsorButton = document.getElementById('closeSponsorButton');
  const sponsorPage = document.getElementById('sponsorPage');

  // Set review link based on browser
  const reviewLink = document.getElementById('reviewLink');
  if (reviewLink) {
    const isEdge = navigator.userAgent.includes('Edg/');
    reviewLink.href = isEdge
      ? 'https://microsoftedge.microsoft.com/addons/detail/lockedin/hibjbjgfbmhpiaapeccnfddnpabnlklj'
      : 'https://addons.mozilla.org/en-US/firefox/addon/lockedin-yt/';
  }

  if (sponsorButton && sponsorPage) {
    sponsorButton.addEventListener('click', () => {
      closePowerDropdown();
      closeThumbnailDropdown();
      sponsorPage.classList.add('open');
      updateHeaderVisibility();
    });
  }

  if (closeSponsorButton && sponsorPage) {
    closeSponsorButton.addEventListener('click', () => {
      sponsorPage.classList.remove('open');
      updateHeaderVisibility();
    });
  }
}

// ===== POWER BUTTON =====
function setupPowerButton() {
  const powerButton = document.getElementById('powerButton');
  const powerDropdown = document.getElementById('powerDropdown');
  const dropdownOptions = document.querySelectorAll('.power-dropdown-option');
  if (!powerButton || !powerDropdown) {
    return;
  }

  browser.storage.sync.get(['extensionEnabled', 'takeBreak', 'breakDuration', 'breakStartTime'], (result) => {
    const isEnabled = result.extensionEnabled !== undefined ? result.extensionEnabled : true;

    if (!isEnabled && result.breakStartTime && result.takeBreak) {
      startBreakCountdown(Number(result.breakStartTime), Number(result.breakDuration));
    }
  });

  powerButton.addEventListener('click', (e) => {
    e.stopPropagation();
    browser.storage.sync.get(['extensionEnabled'], (result) => {
      const isEnabled = result.extensionEnabled !== undefined ? result.extensionEnabled : true;
      if (!isEnabled) {
        browser.storage.sync.set({
          extensionEnabled: true,
          breakStartTime: null,
          takeBreak: false
        }, () => {
          if (browser.runtime.lastError) {
            console.error('LockedIn: Failed to save power state', browser.runtime.lastError);
            return;
          }
          browser.runtime.sendMessage({ action: 'cancelBreakTimer' }).catch(() => {});
          if (breakInterval) {
            clearInterval(breakInterval);
            breakInterval = null;
          }
          updatePowerState(true);
          browser.tabs.query({}, (tabs) => {
            tabs.forEach((tab) => {
              if (isYouTubeTabUrl(tab.url)) {
                browser.tabs.sendMessage(tab.id, {
                  action: 'powerStateChanged',
                  enabled: true
                }).catch(() => {});
              }
            });
          });
        });
      } else {
        const shouldOpen = !powerDropdown.classList.contains('open');
        powerDropdown.classList.remove('open');
        if (shouldOpen) {
          closeThumbnailDropdown();
          powerDropdown.classList.add('open');
        }
      }
    });
  });

  document.addEventListener('click', (e) => {
    if (!powerButton.contains(e.target) && !powerDropdown.contains(e.target)) {
      powerDropdown.classList.remove('open');
    }
  });

  dropdownOptions.forEach(option => {
    option.addEventListener('click', () => {
      const duration = parseInt(option.dataset.duration, 10);
      powerDropdown.classList.remove('open');
      const saveData = {
        extensionEnabled: false,
        takeBreak: duration > 0,
        breakDuration: duration
      };
      if (duration > 0) {
        saveData.breakStartTime = Date.now();
        browser.runtime.sendMessage({
          action: 'startBreakTimer',
          duration: duration
        }).catch(() => {});
        startBreakCountdown(saveData.breakStartTime, duration);
      } else {
        saveData.breakStartTime = null;
      }
      browser.storage.sync.set(saveData, () => {
        if (browser.runtime.lastError) {
          console.error('LockedIn: Failed to save power state', browser.runtime.lastError);
          return;
        }
        updatePowerState(false);
        browser.tabs.query({}, (tabs) => {
          tabs.forEach((tab) => {
            if (isYouTubeTabUrl(tab.url)) {
              browser.tabs.sendMessage(tab.id, {
                action: 'powerStateChanged',
                enabled: false
              }).catch(() => {});
            }
          });
        });
      });
    });
  });
}

function closePowerDropdown() {
  const dropdown = document.getElementById('powerDropdown');
  if (dropdown) {
    dropdown.classList.remove('open');
  }
}

function closeThumbnailDropdown() {
  const dropdown = document.getElementById('thumbnailDropdown');
  const modeButton = document.getElementById('thumbnailModeButton');
  if (dropdown) {
    dropdown.classList.remove('open');
  }
  if (modeButton) {
    modeButton.classList.remove('open');
  }
}

function positionThumbnailDropdown(modeButton, dropdown) {
  if (!modeButton || !dropdown) return;

  // Measure menu size while keeping it visually hidden.
  const wasOpen = dropdown.classList.contains('open');
  if (!wasOpen) {
    dropdown.classList.add('open');
  }
  dropdown.style.visibility = 'hidden';

  const triggerRect = modeButton.getBoundingClientRect();
  const dropdownRect = dropdown.getBoundingClientRect();
  const menuWidth = dropdownRect.width || 128;
  const menuHeight = dropdownRect.height || dropdown.scrollHeight || 0;

  const margin = 6;
  let left = triggerRect.right - menuWidth;
  if (left < margin) left = margin;
  if (left + menuWidth > window.innerWidth - margin) {
    left = Math.max(margin, window.innerWidth - menuWidth - margin);
  }

  let top = triggerRect.bottom + 2;
  if (top + menuHeight > window.innerHeight - margin) {
    top = Math.max(margin, triggerRect.top - menuHeight - 2);
  }

  dropdown.style.left = `${Math.round(left)}px`;
  dropdown.style.top = `${Math.round(top)}px`;
  dropdown.style.visibility = '';

  if (!wasOpen) {
    dropdown.classList.remove('open');
  }
}

function updateHeaderVisibility() {
  const popupContainer = document.querySelector('.popup-container');
  if (!popupContainer) return;
  const settingsMenu = document.getElementById('settingsMenu');
  const feedbackPage = document.getElementById('feedbackPage');
  const sponsorPage = document.getElementById('sponsorPage');
  const isMenuOpen = settingsMenu && settingsMenu.classList.contains('open');
  const overlayActive = !!(isMenuOpen ||
    (feedbackPage && feedbackPage.classList.contains('open')) ||
    (sponsorPage && sponsorPage.classList.contains('open')));
  popupContainer.classList.toggle('overlay-active', overlayActive);
  popupContainer.classList.toggle('menu-open', !!isMenuOpen);
}

function updateMenuDropdownDisplay(type, value) {
  const normalized = type === 'appearance'
    ? (APPEARANCE_OPTIONS.includes(value) ? value : 'auto')
    : (LANGUAGE_OPTIONS.includes(value) ? value : 'auto');
  const valueElement = document.getElementById(`${type}DropdownValue`);
  if (valueElement) {
    if (type === 'appearance') {
      const labelKey = APPEARANCE_LABEL_KEYS[normalized] || APPEARANCE_LABEL_KEYS.auto;
      valueElement.textContent = translate(labelKey) || translate(APPEARANCE_LABEL_KEYS.auto) || 'Auto';
    } else {
      const labelMeta = LANGUAGE_LABELS[normalized] || LANGUAGE_LABELS.auto;
      if (labelMeta.labelKey) {
        valueElement.textContent = translate(labelMeta.labelKey) || labelMeta.fallback || 'Auto';
      } else {
        valueElement.textContent = labelMeta.label;
      }
    }
  }
  const panel = document.querySelector(`.menu-inline-dropdown[data-dropdown-type="${type}"]`);
  if (panel) {
    panel.querySelectorAll('.menu-inline-option').forEach((option) => {
      option.classList.toggle('selected', option.dataset.value === normalized);
    });
  }
}

function closeMenuInlineDropdowns() {
  const dropdowns = document.querySelectorAll('.menu-inline-dropdown');
  dropdowns.forEach((dropdown) => {
    dropdown.classList.remove('open');
    dropdown.style.top = '';
    dropdown.style.left = '';
    dropdown.style.maxHeight = '';
    dropdown.style.width = '';
    dropdown.style.visibility = '';
    const trigger = document.querySelector(`[data-menu-dropdown-target="${dropdown.id}"]`);
    if (trigger) {
      trigger.setAttribute('aria-expanded', 'false');
      trigger.classList.remove('open');
    }
  });
}

function applyAppearanceSetting(value, options = {}) {
  const normalized = APPEARANCE_OPTIONS.includes(value) ? value : 'auto';
  currentAppearanceValue = normalized;
  const popupContainer = document.querySelector('.popup-container');
  const headerLogo = document.querySelector('.header-logo');
  const isDisabled = popupContainer.classList.contains('disabled');
  let isLightMode = false;
  if (normalized === 'light') {
    isLightMode = true;
  } else if (normalized === 'dark') {
    isLightMode = false;
  } else {
    isLightMode = window.matchMedia && window.matchMedia('(prefers-color-scheme: light)').matches;
  }
  if (isLightMode) {
    popupContainer.classList.add('light-mode');
    if (headerLogo) {
      headerLogo.src = isDisabled ? '../assets/icons/LightOff.png' : '../assets/icons/iconFullLight.png';
    }
  } else {
    popupContainer.classList.remove('light-mode');
    if (headerLogo) {
      headerLogo.src = isDisabled ? '../assets/icons/LockedOut.png' : '../assets/icons/iconFull.png';
    }
  }
  updateMenuDropdownDisplay('appearance', normalized);
  if (!options.skipSave) {
    browser.storage.sync.set({ appearance: normalized });
  }
}

function applyLanguageSetting(value, options = {}) {
  const normalized = LANGUAGE_OPTIONS.includes(value) ? value : 'auto';
  currentLanguagePreference = normalized;
  const effectiveLanguage = resolveLanguagePreference(normalized);
  applyTranslations(effectiveLanguage);
  updateThumbnailModeUI(currentThumbnailMode);
  updateMenuDropdownDisplay('language', normalized);
  updateMenuDropdownDisplay('appearance', currentAppearanceValue);
  updateSettingsLockDisplay(currentSettingsLockDuration);
  browser.storage.sync.get(['extensionEnabled', 'takeBreak', 'breakStartTime', 'breakDuration'], (state) => {
    if (state && state.takeBreak && state.breakStartTime && state.breakDuration && state.extensionEnabled === false) {
      startBreakCountdown(Number(state.breakStartTime), Number(state.breakDuration));
    }
  });
  if (!options.skipSave) {
    browser.storage.sync.set({ language: normalized });
  }
}

function positionMenuDropdown(trigger, panel) {
  if (!trigger || !panel || !panel.classList.contains('open')) {
    return;
  }
  panel.style.visibility = 'hidden';
  panel.style.top = '0px';
  panel.style.left = '0px';
  const margin = 8;
  const viewportWidth = window.innerWidth;
  const viewportHeight = window.innerHeight;
  panel.style.maxHeight = `${Math.min(220, viewportHeight - margin * 2)}px`;
  const triggerRect = trigger.getBoundingClientRect();
  const desiredWidth = Math.max(triggerRect.width + 8, 118);
  panel.style.width = `${desiredWidth}px`;
  const panelRect = panel.getBoundingClientRect();
  const panelWidth = panelRect.width || desiredWidth;
  let panelHeight = panelRect.height || panel.scrollHeight || 0;
  if (panelHeight === 0) {
    panelHeight = Math.min(220, viewportHeight - margin * 2);
  }
  let left = triggerRect.left;
  if (left < margin) {
    left = margin;
  }
  if (left + panelWidth > viewportWidth - margin) {
    left = Math.max(margin, viewportWidth - margin - panelWidth);
  }
  let top = triggerRect.bottom + 4;
  if (top + panelHeight > viewportHeight - margin) {
    top = Math.max(margin, triggerRect.top - panelHeight - 4);
  }
  panel.style.left = `${left}px`;
  panel.style.top = `${top}px`;
  panel.style.visibility = 'visible';
}

function updatePowerState(isEnabled) {
  const popupContainer = document.querySelector('.popup-container');
  const breakTimerText = document.getElementById('breakTimerText');
  const headerLogo = document.querySelector('.header-logo');
  const isLightMode = popupContainer.classList.contains('light-mode');

  if (isEnabled) {
    popupContainer.classList.remove('disabled');
    if (breakTimerText) breakTimerText.style.display = 'none';
    if (headerLogo) {
      headerLogo.src = isLightMode ? '../assets/icons/iconFullLight.png' : '../assets/icons/iconFull.png';
    }
  } else {
    popupContainer.classList.add('disabled');
    if (headerLogo) {
      headerLogo.src = isLightMode ? '../assets/icons/LightOff.png' : '../assets/icons/LockedOut.png';
    }
  }
}

// ===== BREAK TIMER =====
let breakInterval = null;

function startBreakCountdown(startTime, duration) {
  const breakTimerText = document.getElementById('breakTimerText');
  if (!breakTimerText) return;

  breakTimerText.style.display = 'block';
  const breakPrefix = translate('state.breakTimerPrefix') || 'See you in';

  if (breakInterval) clearInterval(breakInterval);
  const normalizedDuration = Number(duration);
  const fallbackDuration = Number.isFinite(normalizedDuration) && normalizedDuration > 0 ? normalizedDuration : 5;
  let normalizedStart = Number(startTime);
  const now = Date.now();
  if (!Number.isFinite(normalizedStart) || normalizedStart <= 0) {
    normalizedStart = now;
    browser.storage.sync.set({ breakStartTime: normalizedStart });
  }
  const endTime = normalizedStart + (fallbackDuration * 60 * 1000);

  function updateTimer() {
    const currentTime = Date.now();
    const remaining = Math.max(0, endTime - currentTime);
    const totalSeconds = Math.floor(remaining / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;

    if (remaining <= 0) {
      clearInterval(breakInterval);
      breakTimerText.textContent = `${breakPrefix} 0:00`;
      breakTimerText.style.display = 'none';
      updatePowerState(true);
      browser.runtime.sendMessage({ action: 'completeBreak' }).catch(() => {
        browser.storage.sync.set({ extensionEnabled: true, breakStartTime: null });
      });
      return;
    }

    breakTimerText.textContent = `${breakPrefix} ${minutes}:${seconds.toString().padStart(2, '0')}`;
  }

  updateTimer();
  breakInterval = setInterval(updateTimer, 1000);
}

// ===== SETTINGS LOCK TIMER =====
// When enabled, every time the popup opens it is covered by a countdown, and
// settings only become usable once it reaches 0. Closing the popup resets it.
const SETTINGS_LOCK_TICK_MS = 200;
let settingsLockInterval = null;

function normalizeSettingsLockDuration(value) {
  const seconds = Number(value);
  return SETTINGS_LOCK_OPTIONS.includes(seconds) ? seconds : 0;
}

function formatSettingsLockLabel(seconds) {
  if (seconds === 0) {
    return translate('settingsLock.option.off') || 'Off';
  }
  if (seconds >= 60) {
    const minutes = seconds / 60;
    return translate('settingsLock.option.minutes', { minutes }) || `${minutes} min`;
  }
  return translate('settingsLock.option.seconds', { seconds }) || `${seconds}s`;
}

// Countdown text: plain seconds for short locks, m:ss once a lock is a minute or longer
function formatSettingsLockRemaining(remainingSeconds, duration) {
  if (duration < 60) {
    return String(remainingSeconds);
  }
  const minutes = Math.floor(remainingSeconds / 60);
  const seconds = remainingSeconds % 60;
  return `${minutes}:${seconds.toString().padStart(2, '0')}`;
}

function updateSettingsLockDisplay(seconds) {
  const normalized = normalizeSettingsLockDuration(seconds);
  const valueElement = document.getElementById('settingsLockDropdownValue');
  if (valueElement) {
    valueElement.textContent = formatSettingsLockLabel(normalized);
  }
  document.querySelectorAll('#settingsLockDropdownPanel .menu-inline-option').forEach((option) => {
    const optionSeconds = Number(option.dataset.value);
    option.textContent = formatSettingsLockLabel(optionSeconds);
    option.classList.toggle('selected', optionSeconds === normalized);
  });
  // "Hide Countdown" only matters while the timer is on
  document.querySelectorAll('.settings-lock-countdown-row').forEach((row) => {
    row.hidden = normalized === 0;
  });
}

function applySettingsLockDuration(value) {
  const normalized = normalizeSettingsLockDuration(value);
  currentSettingsLockDuration = normalized;
  updateSettingsLockDisplay(normalized);
  // Takes effect the next time the popup is opened
  browser.storage.sync.set({ settingsLockDuration: normalized });
}

function setSettingsLockContentInert(isInert) {
  const popupContainer = document.querySelector('.popup-container');
  if (!popupContainer) return;
  // Keep keyboard focus from reaching controls hidden behind the lock overlay
  Array.from(popupContainer.children).forEach((child) => {
    if (child.id !== 'settingsLockOverlay') {
      child.inert = isInert;
    }
  });
}

function setupSettingsLock() {
  const popupContainer = document.querySelector('.popup-container');
  if (!popupContainer) return;

  browser.storage.sync.get(['settingsLockDuration', 'settingsLockHideCountdown'], (result) => {
    const duration = normalizeSettingsLockDuration(result && result.settingsLockDuration);
    const showCountdown = !result || result.settingsLockHideCountdown !== true;
    if (duration > 0) {
      startSettingsLockCountdown(duration, showCountdown);
    }
    popupContainer.classList.remove('settings-lock-checking');
  });
}

function startSettingsLockCountdown(duration, showCountdown) {
  const popupContainer = document.querySelector('.popup-container');
  const countdown = document.getElementById('settingsLockCountdown');
  if (!popupContainer || !countdown) return;

  const endTime = Date.now() + duration * 1000;

  countdown.hidden = !showCountdown;
  popupContainer.classList.add('settings-locked');
  setSettingsLockContentInert(true);

  function unlock() {
    clearInterval(settingsLockInterval);
    settingsLockInterval = null;
    setSettingsLockContentInert(false);
    popupContainer.classList.remove('settings-locked');
    popupContainer.classList.add('settings-unlocking');
    setTimeout(() => popupContainer.classList.remove('settings-unlocking'), 250);
  }

  function updateCountdown() {
    const remaining = Math.max(0, endTime - Date.now());
    countdown.textContent = formatSettingsLockRemaining(Math.ceil(remaining / 1000), duration);
    if (remaining <= 0) {
      unlock();
    }
  }

  if (settingsLockInterval) clearInterval(settingsLockInterval);
  updateCountdown();
  settingsLockInterval = setInterval(updateCountdown, SETTINGS_LOCK_TICK_MS);
}

// ===== CUSTOM MEME UPLOAD =====
function setupCustomMemeUpload() {
  const fileInput = document.getElementById('customMemeInput');
  const gallery = document.getElementById('customMemeGallery');

  if (!fileInput || !gallery) return;
  if (fileInput.disabled || fileInput.dataset.disabled === 'true') return;

  function renderGallery(memes) {
    gallery.innerHTML = '';
    if (!memes || memes.length === 0) {
      gallery.classList.remove('visible');
      return;
    }
    gallery.classList.add('visible');
    memes.forEach((meme, index) => {
      const item = document.createElement('div');
      item.className = 'gallery-item';
      const img = document.createElement('img');
      img.src = meme;
      img.addEventListener('click', () => { window.open(meme, '_blank'); });
      const deleteBtn = document.createElement('button');
      deleteBtn.className = 'gallery-delete-btn';
      deleteBtn.innerHTML = '✕';
      deleteBtn.addEventListener('click', (e) => { e.stopPropagation(); deleteMeme(index); });
      item.appendChild(img);
      item.appendChild(deleteBtn);
      gallery.appendChild(item);
    });
  }

  function readFilesAsDataUrls(files) {
    return Promise.all(files.map((file) => {
      return new Promise((resolve) => {
        const reader = new FileReader();
        reader.onload = (event) => resolve(event.target.result);
        reader.onerror = () => resolve(null);
        reader.readAsDataURL(file);
      });
    }));
  }

  function deleteMeme(index) {
    browser.storage.local.get('customMemes', (result) => {
      const memes = result.customMemes || [];
      memes.splice(index, 1);
      if (memes.length === 0) {
        browser.storage.local.remove('customMemes', () => {
          renderGallery([]);
          notifyContentScript(null);
        });
      } else {
        browser.storage.local.set({ customMemes: memes }, () => {
          renderGallery(memes);
          notifyContentScript(memes);
        });
      }
    });
  }

  function notifyContentScript(memes) {
    browser.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (tabs[0]) {
        browser.tabs.sendMessage(tabs[0].id, { action: 'customMemesUpdated', memes: memes }).catch(() => {});
      }
    });
  }

  browser.storage.local.get('customMemes', (result) => {
    if (result.customMemes && result.customMemes.length > 0) renderGallery(result.customMemes);
  });

  fileInput.addEventListener('change', function(e) {
    const files = Array.from(e.target.files);
    if (!files.length) return;
    browser.storage.local.get('customMemes', (result) => {
      const existingMemes = result.customMemes || [];
      const validTypes = ['image/png', 'image/jpeg', 'image/gif', 'image/webp'];
      const validFiles = [];
      for (const file of files) {
        if (file.size > 500 * 1024) { alert(translate('customMeme.tooLarge', { filename: file.name })); continue; }
        if (!validTypes.includes(file.type)) { alert(translate('customMeme.invalidType', { filename: file.name })); continue; }
        validFiles.push(file);
      }
      if (existingMemes.length + validFiles.length > 5) { alert(translate('customMeme.maxImages', { existing: existingMemes.length, added: validFiles.length })); fileInput.value = ''; return; }
      if (validFiles.length === 0) { fileInput.value = ''; return; }
      readFilesAsDataUrls(validFiles).then((dataUrls) => {
        const newMemes = dataUrls.filter(Boolean);
        if (newMemes.length === 0) { fileInput.value = ''; return; }
        const allMemes = [...existingMemes, ...newMemes];
        renderGallery(allMemes);
        browser.storage.local.set({ customMemes: allMemes }, () => {
          fileInput.value = '';
          notifyContentScript(allMemes);
        });
      });
    });
  });
}

// ===== LOAD SETTINGS =====
function loadSettings() {
  return new Promise((resolve) => {
    const toggles = document.querySelectorAll('input[type="checkbox"]');
    browser.storage.sync.get(null, (settings) => {
      if (settings.hideFeedImage !== undefined && settings.hideFeedQuote === undefined) {
        settings.hideFeedQuote = settings.hideFeedImage;
        browser.storage.sync.set({ hideFeedQuote: settings.hideFeedImage }, () => {
          browser.storage.sync.remove('hideFeedImage');
        });
      }
      const currentSettings = { ...DEFAULT_SETTINGS, ...settings };
      toggles.forEach((toggle) => {
        const settingId = toggle.dataset.setting;
        if (currentSettings[settingId] !== undefined) toggle.checked = currentSettings[settingId];
      });
      updateThumbnailModeUI(currentSettings.hideVideoThumbnails);
      currentSettingsLockDuration = normalizeSettingsLockDuration(currentSettings.settingsLockDuration);
      const popupContainer = document.querySelector('.popup-container');
      if (popupContainer) popupContainer.classList.toggle('disabled', !currentSettings.extensionEnabled);
      let savedAppearance = currentSettings.appearance || 'auto';
      if (savedAppearance === 'auto' && currentSettings.lightMode) savedAppearance = 'light';
      applyAppearanceSetting(savedAppearance, { skipSave: true });
      applyLanguageSetting(currentSettings.language || 'auto', { skipSave: true });
      if (currentSettings.hideFeed) document.getElementById('redirectToSubsRow').classList.add('visible');
      const cleanFeedSubToggles = document.getElementById('cleanFeedSubToggles');
      if (!currentSettings.cleanHomepageFeed) cleanFeedSubToggles?.classList.add('visible');
      else cleanFeedSubToggles?.classList.remove('visible');
      const sidebarSubToggles = document.getElementById('sidebarSubToggles');
      if (!currentSettings.hideSidebar) sidebarSubToggles?.classList.add('visible');
      else sidebarSubToggles?.classList.remove('visible');
      const cleanSidebarSubToggles = document.getElementById('cleanSidebarSubToggles');
      if (!currentSettings.cleanSidebar) cleanSidebarSubToggles?.classList.add('visible');
      else cleanSidebarSubToggles?.classList.remove('visible');
      const autoplaySubToggles = document.getElementById('autoplaySubToggles');
      if (!currentSettings.disableAutoplay) autoplaySubToggles?.classList.add('visible');
      else autoplaySubToggles?.classList.remove('visible');
      resolve();
    });
  });
}

function setupThumbnailModeDropdown() {
  const modeButton = document.getElementById('thumbnailModeButton');
  const dropdown = document.getElementById('thumbnailDropdown');
  const options = document.querySelectorAll('.thumbnail-dropdown-option');
  if (!modeButton || !dropdown || options.length === 0) {
    return;
  }

  modeButton.addEventListener('click', (e) => {
    e.stopPropagation();
    const shouldOpen = !dropdown.classList.contains('open');
    closeThumbnailDropdown();
    if (shouldOpen) {
      closePowerDropdown();
      positionThumbnailDropdown(modeButton, dropdown);
      dropdown.classList.add('open');
      modeButton.classList.add('open');
    }
  });

  options.forEach((option) => {
    option.addEventListener('click', (e) => {
      e.stopPropagation();
      const mode = normalizeThumbnailMode(option.dataset.mode);
      updateThumbnailModeUI(mode);
      closeThumbnailDropdown();
      browser.storage.sync.set({ hideVideoThumbnails: mode }, () => {
        browser.tabs.query({ active: true, currentWindow: true }, (tabs) => {
          if (tabs[0]) {
            browser.tabs.sendMessage(tabs[0].id, {
              action: 'settingChanged',
              setting: 'hideVideoThumbnails',
              value: mode
            }).catch(() => {});
          }
        });
      });
    });
  });

  document.addEventListener('click', (e) => {
    if (!modeButton.contains(e.target) && !dropdown.contains(e.target)) {
      closeThumbnailDropdown();
    }
  });

  const settingsArea = document.getElementById('settingsArea');
  if (settingsArea) {
    settingsArea.addEventListener('scroll', () => {
      if (dropdown.classList.contains('open')) {
        closeThumbnailDropdown();
      }
    }, { passive: true });
  }
}

// ===== TOGGLE LISTENERS =====
function setupToggleListeners() {
  const toggles = document.querySelectorAll('input[type="checkbox"]');
  toggles.forEach((toggle) => {
    toggle.addEventListener('change', (e) => {
      const settingId = e.target.dataset.setting;
      const isChecked = e.target.checked;
      if (settingId === 'hideFeed') {
        const row = document.getElementById('redirectToSubsRow');
        if (isChecked) row.classList.add('visible');
        else {
          row.classList.remove('visible');
          const redirectToggle = document.querySelector('input[data-setting="redirectToSubs"]');
          if (redirectToggle && redirectToggle.checked) { redirectToggle.checked = false; browser.storage.sync.set({ redirectToSubs: false }); }
        }
      }
      if (settingId === 'cleanHomepageFeed') {
        const sub = document.getElementById('cleanFeedSubToggles');
        if (!isChecked) sub?.classList.add('visible');
        else {
          sub?.classList.remove('visible');
          ['hideCommunityPosts', 'hideFeaturedContent', 'hideMembersOnly', 'hidePlayables'].forEach(s => {
            const t = document.querySelector(`input[data-setting="${s}"]`);
            if (t && t.checked) { t.checked = false; browser.storage.sync.set({ [s]: false }); }
          });
        }
      }
      if (settingId === 'hideSidebar') {
        const sub = document.getElementById('sidebarSubToggles');
        if (!isChecked) sub?.classList.add('visible');
        else {
          sub?.classList.remove('visible');
          ['hideRecommended', 'hideSidebarShorts', 'hidePlaylists'].forEach(s => {
            const t = document.querySelector(`input[data-setting="${s}"]`);
            if (t && t.checked) { t.checked = false; browser.storage.sync.set({ [s]: false }); }
          });
        }
      }
      if (settingId === 'cleanSidebar') {
        const sub = document.getElementById('cleanSidebarSubToggles');
        if (!isChecked) sub?.classList.add('visible');
        else {
          sub?.classList.remove('visible');
          ['hideExplore', 'hideMoreFromYT', 'hideSubscriptions'].forEach(s => {
            const t = document.querySelector(`input[data-setting="${s}"]`);
            if (t && t.checked) { t.checked = false; browser.storage.sync.set({ [s]: false }); }
          });
        }
      }
      if (settingId === 'disableAutoplay') {
        const sub = document.getElementById('autoplaySubToggles');
        if (!isChecked) sub?.classList.add('visible');
        else {
          sub?.classList.remove('visible');
          ['disablePlaylistAutoplay', 'disableRegularAutoplay'].forEach(s => {
            const t = document.querySelector(`input[data-setting="${s}"]`);
            if (t && t.checked) { t.checked = false; browser.storage.sync.set({ [s]: false }); }
          });
        }
      }

      // Auto-enable Disable Autoplay when both sub-toggles are enabled
      if (['disablePlaylistAutoplay', 'disableRegularAutoplay'].includes(settingId)) {
        const playlistToggle = document.querySelector('input[data-setting="disablePlaylistAutoplay"]');
        const regularToggle = document.querySelector('input[data-setting="disableRegularAutoplay"]');
        const masterToggle = document.querySelector('input[data-setting="disableAutoplay"]');

        if (playlistToggle?.checked && regularToggle?.checked) {
          masterToggle.checked = true;
          browser.storage.sync.set({
            disableAutoplay: true,
            disablePlaylistAutoplay: false,
            disableRegularAutoplay: false
          }, () => {
            playlistToggle.checked = false;
            regularToggle.checked = false;
            const sub = document.getElementById('autoplaySubToggles');
            sub?.classList.remove('visible');
            browser.tabs.query({ active: true, currentWindow: true }, (tabs) => {
              if (tabs[0]) browser.tabs.sendMessage(tabs[0].id, { action: 'settingChanged', setting: 'disableAutoplay', value: true }).catch(() => {});
            });
          });
          return;
        }
      }

      // Auto-enable Clean Homepage Feed when all sub-toggles are enabled
      if (["hideCommunityPosts", "hideFeaturedContent", "hideMembersOnly", "hidePlayables"].includes(settingId)) {
        const communityToggle = document.querySelector('input[data-setting="hideCommunityPosts"]');
        const featuredToggle = document.querySelector('input[data-setting="hideFeaturedContent"]');
        const membersToggle = document.querySelector('input[data-setting="hideMembersOnly"]');
        const playablesToggle = document.querySelector('input[data-setting="hidePlayables"]');
        const cleanFeedToggle = document.querySelector('input[data-setting="cleanHomepageFeed"]');

        if (communityToggle?.checked && featuredToggle?.checked && membersToggle?.checked && playablesToggle?.checked) {
          // All sub-toggles are on, enable parent and collapse sub-toggles
          cleanFeedToggle.checked = true;
          browser.storage.sync.set({
            cleanHomepageFeed: true,
            hideCommunityPosts: false,
            hideFeaturedContent: false,
            hideMembersOnly: false,
            hidePlayables: false
          }, () => {
            // Uncheck all sub-toggles
            communityToggle.checked = false;
            featuredToggle.checked = false;
            membersToggle.checked = false;
            playablesToggle.checked = false;
            // Collapse sub-toggles
            const sub = document.getElementById('cleanFeedSubToggles');
            sub?.classList.remove('visible');
            // Notify content script
            browser.tabs.query({ active: true, currentWindow: true }, (tabs) => {
              if (tabs[0]) browser.tabs.sendMessage(tabs[0].id, { action: 'settingChanged', setting: 'cleanHomepageFeed', value: true }).catch(() => {});
            });
          });
          return; // Skip the normal storage save below
        }
      }

      // Auto-enable Clean Sidebar when all sub-toggles are enabled
      if (['hideExplore', 'hideMoreFromYT', 'hideSubscriptions'].includes(settingId)) {
        const exploreToggle = document.querySelector('input[data-setting="hideExplore"]');
        const moreFromYTToggle = document.querySelector('input[data-setting="hideMoreFromYT"]');
        const subscriptionsToggle = document.querySelector('input[data-setting="hideSubscriptions"]');
        const cleanSidebarToggle = document.querySelector('input[data-setting="cleanSidebar"]');

        if (exploreToggle?.checked && moreFromYTToggle?.checked && subscriptionsToggle?.checked) {
          // All sub-toggles are on, enable parent and collapse sub-toggles
          cleanSidebarToggle.checked = true;
          browser.storage.sync.set({
            cleanSidebar: true,
            hideExplore: false,
            hideMoreFromYT: false,
            hideSubscriptions: false
          }, () => {
            // Uncheck all sub-toggles
            exploreToggle.checked = false;
            moreFromYTToggle.checked = false;
            subscriptionsToggle.checked = false;
            // Collapse sub-toggles
            const sub = document.getElementById('cleanSidebarSubToggles');
            sub?.classList.remove('visible');
            // Notify content script
            browser.tabs.query({ active: true, currentWindow: true }, (tabs) => {
              if (tabs[0]) browser.tabs.sendMessage(tabs[0].id, { action: 'settingChanged', setting: 'cleanSidebar', value: true }).catch(() => {});
            });
          });
          return; // Skip the normal storage save below
        }
      }

      // Auto-enable Hide Video Sidebar when all sub-toggles are enabled
      if (['hideRecommended', 'hideSidebarShorts', 'hidePlaylists'].includes(settingId)) {
        const recommendedToggle = document.querySelector('input[data-setting="hideRecommended"]');
        const shortsToggle = document.querySelector('input[data-setting="hideSidebarShorts"]');
        const playlistsToggle = document.querySelector('input[data-setting="hidePlaylists"]');
        const sidebarToggle = document.querySelector('input[data-setting="hideSidebar"]');

        if (recommendedToggle?.checked && shortsToggle?.checked && playlistsToggle?.checked) {
          // All sub-toggles are on, enable parent and collapse sub-toggles
          sidebarToggle.checked = true;
          browser.storage.sync.set({
            hideSidebar: true,
            hideRecommended: false,
            hideSidebarShorts: false,
            hidePlaylists: false
          }, () => {
            // Uncheck all sub-toggles
            recommendedToggle.checked = false;
            shortsToggle.checked = false;
            playlistsToggle.checked = false;
            // Collapse sub-toggles
            const sub = document.getElementById('sidebarSubToggles');
            sub?.classList.remove('visible');
            // Notify content script
            browser.tabs.query({ active: true, currentWindow: true }, (tabs) => {
              if (tabs[0]) browser.tabs.sendMessage(tabs[0].id, { action: 'settingChanged', setting: 'hideSidebar', value: true }).catch(() => {});
            });
          });
          return; // Skip the normal storage save below
        }
      }

      browser.storage.sync.set({ [settingId]: isChecked }, () => {
        browser.tabs.query({ active: true, currentWindow: true }, (tabs) => {
          if (tabs[0]) browser.tabs.sendMessage(tabs[0].id, { action: 'settingChanged', setting: settingId, value: isChecked }).catch(() => {});
        });
      });
    });
  });

  setupDropdownListeners();
}

function setupDropdownListeners() {
  const triggers = document.querySelectorAll('[data-menu-dropdown-trigger]');
  triggers.forEach((trigger) => {
    const panel = document.getElementById(trigger.dataset.menuDropdownTarget);
    trigger.addEventListener('click', (e) => {
      e.stopPropagation();
      const isOpen = panel.classList.contains('open');
      closeMenuInlineDropdowns();
      if (!isOpen) { panel.classList.add('open'); trigger.classList.add('open'); trigger.setAttribute('aria-expanded', 'true'); requestAnimationFrame(() => positionMenuDropdown(trigger, panel)); }
    });
  });
  document.querySelectorAll('.menu-inline-option').forEach((option) => {
    option.addEventListener('click', () => {
      const type = option.closest('.menu-inline-dropdown').dataset.dropdownType;
      const val = option.dataset.value;
      if (type === 'appearance') applyAppearanceSetting(val);
      else if (type === 'language') applyLanguageSetting(val);
      else if (type === 'settingsLock') applySettingsLockDuration(val);
      closeMenuInlineDropdowns();
    });
  });
  document.addEventListener('click', closeMenuInlineDropdowns);
  window.addEventListener('resize', () => {
    const open = document.querySelector('.menu-inline-dropdown.open');
    if (open) positionMenuDropdown(document.querySelector(`[data-menu-dropdown-target="${open.id}"]`), open);
  });
}

function setupBreakTimer() {
  const btns = document.querySelectorAll('.break-time-btn');
  browser.storage.sync.get('breakDuration', (res) => {
    const dur = res.breakDuration ?? 5;
    btns.forEach(b => {
      const bDur = b.dataset.time ? parseFloat(b.dataset.time) : (b.dataset.seconds ? parseFloat(b.dataset.seconds) / 60 : null);
      if (bDur !== null && Math.abs(bDur - dur) < 0.001) b.classList.add('selected');
    });
  });
  btns.forEach(b => {
    b.addEventListener('click', () => {
      btns.forEach(x => x.classList.remove('selected')); b.classList.add('selected');
      const dur = b.dataset.time ? parseFloat(b.dataset.time) : (b.dataset.seconds ? parseFloat(b.dataset.seconds) / 60 : 5);
      browser.storage.sync.set({ breakDuration: dur });
    });
  });
}
