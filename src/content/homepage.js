// Listen for setting changes from popup
if (typeof browser !== 'undefined' && browser.runtime && browser.runtime.onMessage) {
	browser.runtime.onMessage.addListener((message, sender, sendResponse) => {
		if (message && message.action === 'settingChanged') {
			if (message.setting === 'hidePlayables') {
				hidePlayables(message.value);
			} else if (message.setting === 'hideExploreMoreTopics') {
				hideExploreMoreTopics(message.value);
			} else if (message.setting === 'cleanHomepageFeed') {
				cleanHomepageFeed(message.value);
			} else if (message.setting === 'showFeedSearchWidget' || message.setting === 'hideFeed') {
				// Re-render widget when toggle or widget visibility changes
				latestSyncedSettings[message.setting] = message.value;
				hideFeed(latestSyncedSettings.hideFeed);
			}
		}
	});
}
// ===== HOMEPAGE MODULE =====

function dataUrlToBlob(dataUrl) {
	const parts = dataUrl.split(',');
	if (parts.length < 2) {
		throw new Error('Invalid data URL');
	}
	const mimeMatch = parts[0].match(/:(.*?);/);
	const mime = mimeMatch ? mimeMatch[1] : 'image/png';
	const binaryString = atob(parts[1]);
	const len = binaryString.length;
	const bytes = new Uint8Array(len);
	for (let i = 0; i < len; i++) {
		bytes[i] = binaryString.charCodeAt(i);
	}
	return new Blob([bytes], { type: mime });
}

function getImageSource(imageUrl) {
	if (!imageUrl || !imageUrl.startsWith('data:')) {
		return { src: imageUrl, cleanup: null };
	}
	try {
		const blob = dataUrlToBlob(imageUrl);
		const objectUrl = URL.createObjectURL(blob);
		return {
			src: objectUrl,
			cleanup: () => URL.revokeObjectURL(objectUrl)
		};
	} catch (error) {
		console.error('LockedIn: Failed to convert custom meme to blob', error);
		return { src: null, cleanup: null };
	}
}

const QUOTES_URL = (() => {
	try {
		const api = typeof browser !== 'undefined' ? browser : chrome;
		return api?.runtime?.getURL ? api.runtime.getURL('assets/library/quotes.json') : null;
	} catch (error) {
		return null;
	}
})();

const FALLBACK_QUOTES = [
	{ text: 'Well done is better than well said.', author: 'Benjamin Franklin' },
	{ text: 'It does not matter how slowly you go as long as you do not stop.', author: 'Confucius' },
	{ text: 'Quality is not an act, it is a habit.', author: 'Aristotle' },
	{ text: 'Well begun is half done.', author: 'Aristotle' },
	{ text: 'You have power over your mind — not outside events.', author: 'Marcus Aurelius' },
	{ text: 'He who knows, does not speak. He who speaks, does not know.', author: 'Lao Tzu' },
	{ text: 'Learning never exhausts the mind.', author: 'Leonardo da Vinci' },
	{ text: 'Whatever you are, be a good one.', author: 'Abraham Lincoln' },
	{ text: 'Genius is one percent inspiration and ninety-nine percent perspiration.', author: 'Thomas Edison' },
	{ text: 'I go with the idea that the future depends on what we do in the present.', author: 'Mahatma Gandhi' }
];

let cachedQuotes = [...FALLBACK_QUOTES];
let quotesLoaded = false;

async function loadQuotesOnce() {
	if (quotesLoaded) return;
	quotesLoaded = true;
	if (!QUOTES_URL) return;
	try {
		const response = await fetch(QUOTES_URL);
		if (!response.ok) return;
		const data = await response.json();
		if (Array.isArray(data) && data.length) {
			const cleaned = data.filter((quote) => quote && quote.text && quote.author);
			cachedQuotes = cleaned.length ? cleaned : [...FALLBACK_QUOTES];
		}
	} catch (error) {
		console.debug('LockedIn: Failed to load quotes.json', error);
	}
}

loadQuotesOnce();

function getRandomQuote() {
	if (!cachedQuotes.length) cachedQuotes = [...FALLBACK_QUOTES];
	return cachedQuotes[Math.floor(Math.random() * cachedQuotes.length)];
}

function getColorLuminance(color) {
	if (!color) return null;
	const match = color.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/i);
	if (!match) return null;
	const r = parseInt(match[1], 10) / 255;
	const g = parseInt(match[2], 10) / 255;
	const b = parseInt(match[3], 10) / 255;
	return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

function isYouTubeDarkMode() {
	const docEl = document.documentElement;
	if (docEl?.hasAttribute('dark')) return true;
	if (docEl?.getAttribute('theme') === 'dark') return true;
	if (docEl?.classList.contains('dark')) return true;
	const appEl = document.querySelector('ytd-app') || document.body;
	if (appEl) {
		const bg = window.getComputedStyle(appEl).backgroundColor;
		const lum = getColorLuminance(bg);
		if (lum !== null) return lum < 0.5;
	}
	return window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
}

let homepageInterceptorSetup = false;

// --- Playables Section Observer ---
let playablesObserver = null;
let playablesShouldHide = false;

function handlePlayablesSections() {
	document.querySelectorAll('ytd-rich-section-renderer').forEach(section => {
		const headerLink = section.querySelector('#rich-shelf-header a[href="/playables"], #title-container a[href="/playables"]');
		if (headerLink) {
			if (playablesShouldHide) {
				section.setAttribute('hidden', '');
				section.style.display = 'none';
				section.setAttribute('data-lockedin-hidden', 'playables-section');
			} else {
				section.removeAttribute('hidden');
				section.style.display = '';
				section.removeAttribute('data-lockedin-hidden');
			}
		}
	});
}

function setupPlayablesObserver() {
	if (playablesObserver) return;
	playablesObserver = new MutationObserver(() => {
		handlePlayablesSections();
	});
	playablesObserver.observe(document.body, { childList: true, subtree: true });
}

function teardownPlayablesObserver() {
	if (playablesObserver) {
		playablesObserver.disconnect();
		playablesObserver = null;
	}
}

function redirectToSubscriptions(shouldRedirect) {
	const styleId = 'lockedin-hide-homepage-nav';

	if (!shouldRedirect) {
		const existingStyle = document.getElementById(styleId);
		if (existingStyle) existingStyle.remove();

		if (window._lockedinHomepageInterceptor) {
			document.removeEventListener('click', window._lockedinHomepageInterceptor, true);
			window._lockedinHomepageInterceptor = null;
		}
		homepageInterceptorSetup = false;
		return;
	}

	if (!document.getElementById(styleId)) {
		const style = document.createElement('style');
		style.id = styleId;
		style.textContent = `
			ytd-guide-entry-renderer:has(a[href="/"]),
			ytd-guide-entry-renderer:has(a[title="Home"]) {
				display: none !important;
			}

			ytd-mini-guide-entry-renderer:has(a[href="/"]),
			ytd-mini-guide-entry-renderer:has(a[title="Home"]) {
				display: none !important;
			}

			tp-yt-paper-tab:has(a[href="/"]),
			tp-yt-paper-tab:has(a[href^="/home"]),
			tp-yt-paper-tab:has(a[title="Home"]),
			tp-yt-paper-tab:has(div[title="Home"]),
			yt-tab-shape:has(a[href="/"]),
			yt-tab-shape:has(a[href^="/home"]),
			yt-chip-cloud-chip-renderer:has(a[href="/"]),
			yt-chip-cloud-chip-renderer:has(a[href^="/home"]),
			yt-chip-cloud-chip-renderer:has(div[title="Home"]),
			ytd-feed-filter-chip-bar-renderer tp-yt-paper-tab:has(a[href="/"]),
			ytd-feed-filter-chip-bar-renderer yt-chip-cloud-chip-renderer:has(a[href="/"]),
			ytm-pivot-bar-item-renderer:has([href="/"])
			{
				display: none !important;
			}
		`;
		(document.head || document.documentElement).appendChild(style);
	}

	if (!homepageInterceptorSetup) {
		window._lockedinHomepageInterceptor = function(e) {
			const target = e.target.closest('a[href="/"], a[href="/home"], #logo, ytd-logo, #start a, a[title="YouTube Home"]');
			if (target) {
				e.preventDefault();
				e.stopPropagation();
				window.location.href = 'https://www.youtube.com/feed/subscriptions';
			}
		};
		document.addEventListener('click', window._lockedinHomepageInterceptor, true);
		homepageInterceptorSetup = true;
	}

	if (isHomePath()) {
		window.location.replace('https://www.youtube.com/feed/subscriptions');
	}
}

// ===== YOUTUBE SEARCH WIDGET =====

function createSearchWidget() {
	const isDark = isYouTubeDarkMode();

	const wrapper = document.createElement('div');
	wrapper.id = 'lockedin-feed-placeholder';
	wrapper.style.cssText = `
		position: fixed;
		top: 0;
		left: 0;
		width: 100%;
		height: 100%;
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		z-index: 1000;
		background: transparent;
		pointer-events: none;
	`;

	// Inner content panel (pointer-events re-enabled)
	const panel = document.createElement('div');
	panel.style.cssText = `
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 24px;
		pointer-events: auto;
	`;

	// YouTube logo (SVG inline — matches YouTube's actual logo)
	const logoLink = document.createElement('a');
	logoLink.href = '#';
	logoLink.setAttribute('aria-label', 'Search YouTube');
	logoLink.style.cssText = 'display: flex; align-items: center; gap: 0; text-decoration: none; cursor: default;';
	logoLink.addEventListener('click', e => e.preventDefault());

	const logoSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 90 20" width="90" height="20" style="display:block;">
		<path d="M27.9727 3.12324C27.6435 1.89323 26.6768 0.926623 25.4468 0.597366C23.2197 2.24288e-07 14.285 0 14.285 0C14.285 0 5.35042 2.24288e-07 3.12323 0.597366C1.89323 0.926623 0.926623 1.89323 0.597366 3.12324C2.24288e-07 5.35042 0 10 0 10C0 10 2.24288e-07 14.6496 0.597366 16.8768C0.926623 18.1068 1.89323 19.0734 3.12323 19.4026C5.35042 20 14.285 20 14.285 20C14.285 20 23.2197 20 25.4468 19.4026C26.6768 19.0734 27.6435 18.1068 27.9727 16.8768C28.5701 14.6496 28.5701 10 28.5701 10C28.5701 10 28.5677 5.35042 27.9727 3.12324Z" fill="#FF0000"/>
		<path d="M11.4253 14.2854L18.8477 10.0004L11.4253 5.71533V14.2854Z" fill="white"/>
	</svg>`;

	const youtubeText = document.createElement('span');
	youtubeText.style.cssText = `
		font-family: 'YouTube Noto', Roboto, Arial, sans-serif;
		font-size: 20px;
		font-weight: 500;
		letter-spacing: -0.5px;
		color: ${isDark ? '#ffffff' : '#030303'};
		margin-left: 6px;
		line-height: 1;
		user-select: none;
	`;
	youtubeText.textContent = 'YouTube';

	const logoIconWrapper = document.createElement('span');
	logoIconWrapper.innerHTML = logoSvg;
	logoLink.appendChild(logoIconWrapper);
	logoLink.appendChild(youtubeText);

	// Search form
	const form = document.createElement('form');
	form.style.cssText = 'display: flex; align-items: center; gap: 0; width: 540px; max-width: 90vw;';

	let searchInput; // forward declaration for closure

	form.addEventListener('submit', e => {
		e.preventDefault();
		const q = searchInput.value.trim();
		if (q) {
			window.location.href = `https://www.youtube.com/results?search_query=${encodeURIComponent(q)}`;
		}
	});

	const inputWrapper = document.createElement('div');
	inputWrapper.style.cssText = `
		flex: 1;
		display: flex;
		align-items: center;
		border: 1px solid ${isDark ? '#303030' : '#d3d3d3'};
		border-right: none;
		border-radius: 40px 0 0 40px;
		padding: 0 16px;
		height: 44px;
		background: ${isDark ? '#121212' : '#ffffff'};
		transition: border-color 0.15s, box-shadow 0.15s;
		box-sizing: border-box;
	`;
	inputWrapper.addEventListener('focusin', () => {
		inputWrapper.style.borderColor = '#1c62b9';
		inputWrapper.style.boxShadow = '0 0 0 1px #1c62b9 inset';
	});
	inputWrapper.addEventListener('focusout', () => {
		inputWrapper.style.borderColor = isDark ? '#303030' : '#d3d3d3';
		inputWrapper.style.boxShadow = 'none';
	});

	searchInput = document.createElement('input');
	searchInput.type = 'text';
	searchInput.placeholder = 'Search';
	searchInput.setAttribute('aria-label', 'Search');
	searchInput.style.cssText = `
		flex: 1;
		border: none;
		outline: none;
		background: transparent;
		font-size: 16px;
		font-family: Roboto, Arial, sans-serif;
		color: ${isDark ? '#e8eaed' : '#030303'};
		caret-color: ${isDark ? '#e8eaed' : '#030303'};
		width: 100%;
	`;
	searchInput.setAttribute('autocomplete', 'off');
	searchInput.setAttribute('spellcheck', 'false');

	// Placeholder colour via style tag
	const placeholderStyle = document.getElementById('lockedin-search-widget-styles') || document.createElement('style');
	placeholderStyle.id = 'lockedin-search-widget-styles';
	placeholderStyle.textContent = `
		#lockedin-feed-placeholder input::placeholder {
			color: ${isDark ? '#aaaaaa' : '#909090'};
			opacity: 1;
		}
	`;
	if (!document.getElementById('lockedin-search-widget-styles')) {
		(document.head || document.documentElement).appendChild(placeholderStyle);
	}

	inputWrapper.appendChild(searchInput);

	// Search submit button
	const searchBtn = document.createElement('button');
	searchBtn.type = 'submit';
	searchBtn.setAttribute('aria-label', 'Search');
	searchBtn.style.cssText = `
		width: 64px;
		height: 44px;
		border: 1px solid ${isDark ? '#303030' : '#d3d3d3'};
		border-left: none;
		border-radius: 0 40px 40px 0;
		background: ${isDark ? '#272727' : '#f8f8f8'};
		cursor: pointer;
		display: flex;
		align-items: center;
		justify-content: center;
		transition: background 0.15s;
		flex-shrink: 0;
		box-sizing: border-box;
	`;
	searchBtn.addEventListener('mouseover', () => {
		searchBtn.style.background = isDark ? '#3d3d3d' : '#efefef';
	});
	searchBtn.addEventListener('mouseout', () => {
		searchBtn.style.background = isDark ? '#272727' : '#f8f8f8';
	});
	const iconColor = isDark ? '#aaaaaa' : '#606060';
	searchBtn.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="${iconColor}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
		<circle cx="11" cy="11" r="8"></circle>
		<line x1="21" y1="21" x2="16.65" y2="16.65"></line>
	</svg>`;

	// Voice search button
	const voiceBtn = document.createElement('button');
	voiceBtn.type = 'button';
	voiceBtn.setAttribute('aria-label', 'Search by voice');
	voiceBtn.title = 'Search by voice';
	voiceBtn.style.cssText = `
		width: 40px;
		height: 40px;
		border: none;
		border-radius: 50%;
		background: transparent;
		cursor: pointer;
		display: flex;
		align-items: center;
		justify-content: center;
		margin-left: 8px;
		flex-shrink: 0;
		transition: background 0.15s;
	`;
	voiceBtn.addEventListener('mouseover', () => {
		voiceBtn.style.background = isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.08)';
	});
	voiceBtn.addEventListener('mouseout', () => {
		voiceBtn.style.background = 'transparent';
	});
	voiceBtn.addEventListener('click', () => {
		startVoiceSearch(searchInput, form);
	});
	voiceBtn.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="22" height="22" focusable="false">
		<path fill="${iconColor}" d="M12 2a4 4 0 0 1 4 4v5a4 4 0 0 1-8 0V6a4 4 0 0 1 4-4zm0 2a2 2 0 0 0-2 2v5a2 2 0 0 0 4 0V6a2 2 0 0 0-2-2zm7 7a1 1 0 0 1 1 1 8 8 0 0 1-7 7.94V21h2a1 1 0 0 1 0 2H9a1 1 0 0 1 0-2h2v-1.06A8 8 0 0 1 4 12a1 1 0 0 1 2 0 6 6 0 0 0 12 0 1 1 0 0 1 1-1z"/>
	</svg>`;

	// Powered by label
	const poweredBy = document.createElement('div');
	poweredBy.textContent = 'Powered by LockedIn';
	poweredBy.style.cssText = `
		font-family: Roboto, Arial, sans-serif;
		font-size: 12px;
		color: ${isDark ? 'rgba(255,255,255,0.4)' : 'rgba(0,0,0,0.4)'};
		margin-top: 4px;
		user-select: none;
	`;

	form.appendChild(inputWrapper);
	form.appendChild(searchBtn);
	form.appendChild(voiceBtn);

	panel.appendChild(logoLink);
	panel.appendChild(form);
	panel.appendChild(poweredBy);
	wrapper.appendChild(panel);

	return wrapper;
}

function startVoiceSearch(inputEl) {
	const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
	if (!SpeechRecognition) {
		inputEl.focus();
		return;
	}

	const recognition = new SpeechRecognition();
	recognition.lang = navigator.language || 'en-US';
	recognition.interimResults = false;
	recognition.maxAlternatives = 1;

	const originalPlaceholder = inputEl.placeholder;
	inputEl.placeholder = 'Listening\u2026';
	inputEl.disabled = true;

	recognition.onresult = (event) => {
		const transcript = event.results[0][0].transcript;
		inputEl.value = transcript;
		inputEl.disabled = false;
		inputEl.placeholder = originalPlaceholder;
		if (transcript.trim()) {
			window.location.href = `https://www.youtube.com/results?search_query=${encodeURIComponent(transcript.trim())}`;
		}
	};

	recognition.onerror = () => {
		inputEl.disabled = false;
		inputEl.placeholder = originalPlaceholder;
		inputEl.focus();
	};

	recognition.onend = () => {
		if (inputEl.disabled) {
			inputEl.disabled = false;
			inputEl.placeholder = originalPlaceholder;
		}
	};

	try {
		recognition.start();
	} catch (err) {
		inputEl.disabled = false;
		inputEl.placeholder = originalPlaceholder;
	}
}

function hideFeed(shouldHide) {
	const placeholderId = 'lockedin-feed-placeholder';

	if (!shouldHide) {
		const feedElements = [
			document.querySelector('ytd-rich-grid-renderer'),
			document.querySelector('ytd-two-column-browse-results-renderer'),
			...document.querySelectorAll('[data-lockedin-hidden="feed"]')
		].filter(el => el);

		feedElements.forEach(el => {
			el.style.removeProperty('display');
			el.removeAttribute('data-lockedin-hidden');
		});

		const placeholder = document.getElementById(placeholderId);
		if (placeholder) placeholder.remove();
		const widgetStyles = document.getElementById('lockedin-search-widget-styles');
		if (widgetStyles) widgetStyles.remove();
		return;
	}

	if (window.location.pathname === '/' || window.location.pathname === '/home') {
		const feedSelectors = [
			'ytd-rich-grid-renderer',
			'ytd-two-column-browse-results-renderer #primary',
			'ytd-browse[page-subtype="home"]',
			'ytm-browse',
			'ytm-rich-grid-renderer',
			'ytm-feed'
		];

		feedSelectors.forEach(selector => {
			const elements = document.querySelectorAll(selector);
			elements.forEach(el => {
				if (!el.hasAttribute('data-lockedin-hidden')) {
					el.style.setProperty('display', 'none', 'important');
					el.setAttribute('data-lockedin-hidden', 'feed');
				}
			});
		});

		// If user has explicitly hidden the search widget, show nothing
		if (latestSyncedSettings.showFeedSearchWidget === false) {
			const existingPlaceholder = document.getElementById(placeholderId);
			if (existingPlaceholder) existingPlaceholder.remove();
			const widgetStyles = document.getElementById('lockedin-search-widget-styles');
			if (widgetStyles) widgetStyles.remove();
			return;
		}

		if (!document.getElementById(placeholderId)) {
			const widget = createSearchWidget();
			document.body.appendChild(widget);
			console.log('LockedIn: Search widget injected into body');
		}
	} else {
		const placeholder = document.getElementById(placeholderId);
		if (placeholder) placeholder.remove();
		const widgetStyles = document.getElementById('lockedin-search-widget-styles');
		if (widgetStyles) widgetStyles.remove();
	}
}

function hideCommunityPosts(shouldHide) {
	const isHomepage = window.location.pathname === '/' || window.location.pathname === '/home';
	if (!isHomepage) return;

	if (!shouldHide) {
		document.querySelectorAll('[data-lockedin-hidden="community-post"]').forEach(el => {
			el.removeAttribute('hidden');
			el.style.display = '';
			el.removeAttribute('data-lockedin-hidden');
		});
		return;
	}

	getAllSelectors('communityPost');

	document.querySelectorAll('ytd-rich-section-renderer:has(ytd-rich-item-renderer[is-post])').forEach(section => {
		if (!section.hasAttribute('data-lockedin-hidden')) {
			section.setAttribute('hidden', '');
			section.style.display = 'none';
			section.setAttribute('data-lockedin-hidden', 'community-post');
		}
	});

	document.querySelectorAll('ytd-rich-item-renderer[is-post]').forEach(post => {
		if (!post.hasAttribute('data-lockedin-hidden')) {
			post.setAttribute('hidden', '');
			post.style.display = 'none';
			post.setAttribute('data-lockedin-hidden', 'community-post');
		}
	});

	document.querySelectorAll('ytd-rich-item-renderer:has(ytd-post-renderer), ytd-rich-item-renderer:has(ytd-backstage-post-thread-renderer)').forEach(item => {
		if (!item.hasAttribute('data-lockedin-hidden')) {
			item.setAttribute('hidden', '');
			item.style.display = 'none';
			item.setAttribute('data-lockedin-hidden', 'community-post');
		}
	});

	document.querySelectorAll('ytm-backstage-post-renderer, ytm-post-renderer').forEach(post => {
		const container = post.closest('ytm-item-section-renderer, ytm-rich-item-renderer') || post;
		if (container && !container.hasAttribute('data-lockedin-hidden')) {
			container.setAttribute('hidden', '');
			container.style.display = 'none';
			container.setAttribute('data-lockedin-hidden', 'community-post');
		}
	});

	document.querySelectorAll('ytm-rich-item-renderer:has(ytm-post-renderer), ytm-item-section-renderer:has(ytm-post-renderer), ytm-item-section-renderer:has(ytm-backstage-post-renderer)').forEach(item => {
		if (!item.hasAttribute('data-lockedin-hidden')) {
			item.setAttribute('hidden', '');
			item.style.display = 'none';
			item.setAttribute('data-lockedin-hidden', 'community-post');
		}
	});
}

function hideFeaturedContent(shouldHide) {
	const isHomepage = window.location.pathname === '/' || window.location.pathname === '/home';
	if (!isHomepage) return;

	if (!shouldHide) {
		document.querySelectorAll('[data-lockedin-hidden="featured-content"]').forEach(el => {
			el.removeAttribute('hidden');
			el.style.display = '';
			el.removeAttribute('data-lockedin-hidden');
		});
		return;
	}

	document.querySelectorAll('ytd-rich-section-renderer').forEach(section => {
		const hasVisibleFeaturedBadge = section.querySelector('#featured-badge:not([hidden]), #paygated-featured-badge:not([hidden])');
		const hasPromoRenderer = section.querySelector(
			'ytd-display-ad-renderer, ytd-promoted-sparkles-web-renderer, ytd-primetime-promo-renderer, ytd-statement-banner-renderer, ytd-brand-video-singleton-renderer, ytd-brand-video-shelf-renderer'
		);
		const hasPremiumOrPromoLink = section.querySelector(
			'a[href*="/premium"], a[href*="youtube.com/premium"], a[href*="/music/premium"], a[href*="googleads"], a[href*="doubleclick"]'
		);

		if ((hasVisibleFeaturedBadge || hasPromoRenderer || hasPremiumOrPromoLink) && !section.hasAttribute('data-lockedin-hidden')) {
			section.setAttribute('hidden', '');
			section.style.display = 'none';
			section.setAttribute('data-lockedin-hidden', 'featured-content');
		}
	});

	document.querySelectorAll('ytd-statement-banner-renderer, ytd-primetime-promo-renderer').forEach(banner => {
		if (!banner.hasAttribute('data-lockedin-hidden')) {
			banner.setAttribute('hidden', '');
			banner.style.display = 'none';
			banner.setAttribute('data-lockedin-hidden', 'featured-content');
		}
	});

	document.querySelectorAll('[class*="premium"], [class*="promo"], [href*="/premium"], [href*="googleads"], [href*="doubleclick"]').forEach(promo => {
		if (promo.tagName.toLowerCase().startsWith('ytd-') && !promo.hasAttribute('data-lockedin-hidden')) {
			promo.setAttribute('hidden', '');
			promo.style.display = 'none';
			promo.setAttribute('data-lockedin-hidden', 'featured-content');
		}
	});
}

function hideMembersOnly(shouldHide) {
	const styleId = 'lockedin-hide-members-only';
	let style = document.getElementById(styleId);

	if (!shouldHide) {
		if (style) style.remove();
		document.querySelectorAll('[data-lockedin-hidden="members-only"]').forEach(el => {
			el.style.display = '';
			el.removeAttribute('hidden');
			el.removeAttribute('data-lockedin-hidden');
		});
		return;
	}

	if (!style) {
		style = document.createElement('style');
		style.id = styleId;
		style.textContent = `
			ytd-brand-video-shelf-renderer,
			ytd-brand-video-shelf-renderer #dismissible,
			ytd-rich-section-renderer:has(ytd-brand-video-shelf-renderer),
			ytd-rich-section-renderer:has(a[href*="/channel_memberships" i]),
			ytd-rich-section-renderer:has(a[href*="members-only" i]),
			ytd-rich-shelf-renderer:has(a[href*="/channel_memberships" i]),
			ytd-rich-shelf-renderer:has(a[href*="members-only" i]) {
				display: none !important;
			}
		`;
		(document.head || document.documentElement).appendChild(style);
	}

	function hasMembersOnlyBadge(video) {
		const badgeNodes = video.querySelectorAll(
			'.ytBadgeShapeText, ' +
			'.ytBadgeShapeTextHasMultipleBadgesInRow, ' +
			'.ytContentMetadataViewModelMetadataRow, ' +
			'.ytContentMetadataViewModelBadge, ' +
			'yt-badge-view-model, ' +
			'badge-shape'
		);

		return Array.from(badgeNodes).some((node) => {
			const text = (node.textContent || '').replace(/\s+/g, ' ').trim();
			return /members only|memberships/i.test(text);
		});
	}

	// 1. Hide brand video shelves and membership shelves (e.g. "Get more from memberships")
	document.querySelectorAll('ytd-brand-video-shelf-renderer').forEach(shelf => {
		const container = shelf.closest('ytd-rich-section-renderer') || shelf;
		if (!container.hasAttribute('data-lockedin-hidden')) {
			container.style.display = 'none';
			container.setAttribute('hidden', '');
			container.setAttribute('data-lockedin-hidden', 'members-only');
		}
		if (shelf !== container && !shelf.hasAttribute('data-lockedin-hidden')) {
			shelf.style.display = 'none';
			shelf.setAttribute('hidden', '');
			shelf.setAttribute('data-lockedin-hidden', 'members-only');
		}
		const dismissible = shelf.querySelector('#dismissible');
		if (dismissible && !dismissible.hasAttribute('data-lockedin-hidden')) {
			dismissible.style.display = 'none';
			dismissible.setAttribute('hidden', '');
			dismissible.setAttribute('data-lockedin-hidden', 'members-only');
		}
	});

	// Also hide any rich section/shelf containing membership links or headers
	document.querySelectorAll('ytd-rich-section-renderer, ytd-rich-shelf-renderer').forEach(section => {
		if (section.hasAttribute('data-lockedin-hidden')) return;

		const hasMembershipLink = section.querySelector('a[href*="channel_memberships" i], a[href*="/membership" i], a[href*="members-only" i]');
		const headerText = (section.querySelector('#title, #shelf-header-container, #header, h2')?.textContent || '').toLowerCase();
		const isMembershipHeader = headerText.includes('membership') || headerText.includes('members only') || headerText.includes('members-only');

		if (hasMembershipLink || isMembershipHeader) {
			section.style.display = 'none';
			section.setAttribute('hidden', '');
			section.setAttribute('data-lockedin-hidden', 'members-only');
		}
	});

	// 2. Hide individual members-only video items
	const videoSelectors = [
		'ytd-rich-item-renderer',
		'ytd-grid-video-renderer',
		'ytd-video-renderer',
		'ytd-compact-video-renderer',
		'ytd-playlist-video-renderer',
		'ytm-compact-video-renderer',
		'ytm-video-with-context-renderer',
		'yt-lockup-view-model'
	];

	videoSelectors.forEach(selector => {
		document.querySelectorAll(selector).forEach(video => {
			if (video.hasAttribute('data-lockedin-hidden')) return;

			const memberBadge = hasMembersOnlyBadge(video);
			const membersOnlyHref = video.querySelector('a[href*="members-only" i], a[href*="membership" i]');
			const isMembersOnly = memberBadge || !!membersOnlyHref;

			if (isMembersOnly) {
				video.style.display = 'none';
				video.setAttribute('hidden', '');
				video.setAttribute('data-lockedin-hidden', 'members-only');
			}
		});
	});
}

function hidePlayables(shouldHide) {
		const isHomepage = window.location.pathname === '/' || window.location.pathname === '/home';
		if (!isHomepage) {
			teardownPlayablesObserver();
			return;
		}

		playablesShouldHide = !!shouldHide;
		setupPlayablesObserver();
		handlePlayablesSections();
}

function hideExploreMoreTopics(shouldHide) {
	const isHomepage = window.location.pathname === '/' || window.location.pathname === '/home';
	if (!isHomepage && shouldHide) return;

	const hiddenSelector = '[data-lockedin-hidden="explore-more-topics"]';
	if (!shouldHide) {
		document.querySelectorAll(hiddenSelector).forEach(el => {
			el.removeAttribute('hidden');
			el.style.display = '';
			el.removeAttribute('data-lockedin-hidden');
		});
		return;
	}

	document.querySelectorAll('ytd-chips-shelf-with-video-shelf-renderer').forEach(renderer => {
		const container = renderer.closest('ytd-rich-section-renderer') || renderer;
		if (!container.hasAttribute('data-lockedin-hidden')) {
			container.setAttribute('hidden', '');
			container.style.display = 'none';
			container.setAttribute('data-lockedin-hidden', 'explore-more-topics');
		}
	});
}


function hideVideoThumbnails(mode) {
	const styleId = 'lockedin-video-thumbnails';
	let style = document.getElementById(styleId);
	if (!style) {
		style = document.createElement('style');
		style.id = styleId;
		(document.head || document.documentElement).appendChild(style);
	}

	if (mode === true) mode = 'reveal-on-hover';
	if (mode === false || mode == null) mode = 'off';

	const modes = {
		'off': '',
		'hidden': `
			ytd-thumbnail,
			ytd-playlist-thumbnail,
			.rich-thumbnail,
			yt-thumbnail-view-model,
			ytm-thumbnail,
			ytm-playlist-thumbnail,
			.yt-lockup-view-model-wiz__content-image,
			#video-preview,
			.ytp-videowall-still-image,
			.ytp-modern-videowall-still-image,
			.ytd-display-ad-renderer #media-container,
			ytm-reel-item-renderer .video-thumbnail-container-vertical,
			#thumbnail,
			#thumbnail-container {
				display: none !important;
			}
			ytm-reel-shelf-renderer .reel-shelf-items > * {
				height: auto !important;
				align-items: flex-start !important;
			}
			.ytp-videowall-still-info-content,
			.ytp-modern-videowall-still-info-content {
				opacity: 1 !important;
			}
		`,
		'reveal-on-hover': `
			ytd-thumbnail,
			ytd-playlist-thumbnail,
			.rich-thumbnail,
			yt-thumbnail-view-model,
			.yt-lockup-view-model-wiz__content-image {
				transition: 0.25s ease-in all;
				overflow: hidden;
				max-height: inherit;
				max-width: inherit;
			}
			ytd-rich-item-renderer:not(:hover) ytd-thumbnail,
			ytd-video-renderer:not(:hover) ytd-thumbnail,
			ytd-compact-video-renderer:not(:hover) ytd-thumbnail {
				max-height: 0px !important;
				min-height: 0px !important;
				max-width: 0px !important;
				min-width: 0px !important;
				padding: 0 !important;
				opacity: 0 !important;
			}
			yt-lockup-view-model:not(:hover) .yt-lockup-view-model-wiz__content-image,
			yt-lockup-view-model:not(:hover) yt-thumbnail-view-model {
				max-height: 0px !important;
				min-height: 0px !important;
				max-width: 0px !important;
				min-width: 0px !important;
				padding: 0 !important;
				opacity: 0 !important;
			}
		`,
		'blurred': `
			ytd-thumbnail img,
			ytd-playlist-thumbnail img,
			yt-thumbnail-view-model img,
			ytm-thumbnail img,
			.ytp-videowall-still-image,
			.ytp-modern-videowall-still-image,
			#video-preview img {
				filter: blur(16px) !important;
			}
		`,
		'solid-color': `
			ytd-thumbnail,
			ytd-playlist-thumbnail,
			yt-thumbnail-view-model,
			ytm-thumbnail {
				background-color: var(--yt-spec-additive-background, #212121) !important;
				border-radius: 1rem !important;
			}
			ytd-thumbnail img,
			ytd-playlist-thumbnail img,
			yt-thumbnail-view-model img,
			ytm-thumbnail img,
			.yt-core-image {
				display: none !important;
			}
		`
	};

	style.textContent = modes[mode] || modes.off;
}

function cleanHomepageFeed(shouldClean) {
	hideCommunityPosts(shouldClean);
	hideFeaturedContent(shouldClean);
	hideMembersOnly(shouldClean);
	hidePlayables(shouldClean);
}
