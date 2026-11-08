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

// ===== YOUTUBE HOMEPAGE SEARCH WIDGET =====
//
// When "Hide Homepage Feed" is enabled (and showFeedSearchWidget !== false),
// the homepage video grid and chip bar are hidden, and a centered, YouTube-branded
// search widget is displayed in the feed area.
//
// Key design principles:
//  - Navbar (#masthead) remains 100% untouched and functional.
//  - Left sidebar (#guide, ytd-mini-guide-renderer) remains 100% untouched and functional.
//  - YouTube logo is cloned live from the top navbar (or high-fidelity SVG fallback).
//  - Search input matches YouTube's pill shape (dark/light theme aware).
//  - Autocomplete suggestions dropdown fetched from YouTube's suggest API with
//    keyboard navigation (Up/Down/Enter/Escape), mouse selection, and debounce.
//  - Voice search triggers YouTube's native voice search dialog if present,
//    or Web Speech API fallback.
//  - "Powered by LockedIn" subtitle below the search bar.
//  - Instant teardown on navigation (yt-navigate-start) so it never overlays search results.

const SEARCH_WIDGET_ID = 'lockedin-feed-search-widget';
const SEARCH_WIDGET_STYLE_ID = 'lockedin-search-widget-styles';

let _navListenerAttached = false;
let currentSuggestAbort = null;
let suggestDebounceTimer = null;

function removeSearchWidgetCSS() {
	const style = document.getElementById(SEARCH_WIDGET_STYLE_ID);
	if (style) style.remove();
}

function injectSearchWidgetCSS() {
	let style = document.getElementById(SEARCH_WIDGET_STYLE_ID);
	if (!style) {
		style = document.createElement('style');
		style.id = SEARCH_WIDGET_STYLE_ID;
		(document.head || document.documentElement).appendChild(style);
	}

	style.textContent = `
		/* Hide feed contents & header chip bar on homepage, leaving browse container active */
		ytd-browse[page-subtype="home"] ytd-rich-grid-renderer,
		ytd-browse[page-subtype="home"] #header,
		ytd-browse[page-subtype="home"] ytd-feed-filter-chip-bar-renderer,
		ytm-browse ytm-rich-grid-renderer,
		ytm-browse ytm-feed,
		ytm-browse .chip-bar {
			display: none !important;
		}

		/* Homepage Search Widget container */
		#${SEARCH_WIDGET_ID} {
			--li-text: #0f0f0f;
			--li-subtext: #606060;
			--li-border: #cccccc;
			--li-input-bg: #ffffff;
			--li-btn-bg: #f8f8f8;
			--li-btn-hover: #f0f0f0;
			--li-dropdown-bg: #ffffff;
			--li-dropdown-hover: #f2f2f2;
			--li-dropdown-shadow: rgba(0, 0, 0, 0.15);
			--li-powered: #717171;

			display: flex;
			flex-direction: column;
			align-items: center;
			justify-content: center;
			width: 100%;
			min-height: calc(100vh - 56px - 60px);
			box-sizing: border-box;
			padding: 20px 24px 80px 24px;
			position: relative;
			z-index: 10;
			pointer-events: auto;
		}

		/* Dark mode support */
		html[dark] #${SEARCH_WIDGET_ID},
		html[theme="dark"] #${SEARCH_WIDGET_ID},
		[dark] #${SEARCH_WIDGET_ID},
		#${SEARCH_WIDGET_ID}.lockedin-dark {
			--li-text: #f1f1f1;
			--li-subtext: #aaaaaa;
			--li-border: #303030;
			--li-input-bg: #121212;
			--li-btn-bg: #222222;
			--li-btn-hover: #272727;
			--li-dropdown-bg: #212121;
			--li-dropdown-hover: #383838;
			--li-dropdown-shadow: rgba(0, 0, 0, 0.6);
			--li-powered: #888888;
		}

		.lockedin-widget-inner {
			display: flex;
			flex-direction: column;
			align-items: center;
			width: 100%;
			max-width: 660px;
		}

		.lockedin-logo-box {
			display: flex;
			align-items: center;
			justify-content: center;
			height: 70px;
			margin-bottom: 24px;
			user-select: none;
		}

		.lockedin-search-form {
			display: flex;
			align-items: center;
			position: relative;
			width: 100%;
			box-sizing: border-box;
		}

		.lockedin-search-bar {
			flex: 1;
			display: flex;
			align-items: center;
			height: 48px;
			border-radius: 24px;
			border: 1px solid var(--li-border);
			background: var(--li-input-bg);
			box-sizing: border-box;
			transition: border-color 0.15s ease, box-shadow 0.15s ease;
			overflow: hidden;
		}

		.lockedin-search-bar:focus-within {
			border-color: #1c62b9;
			box-shadow: 0 0 0 1px #1c62b9 inset;
		}

		.lockedin-search-input {
			flex: 1;
			height: 100%;
			border: none;
			outline: none;
			background: transparent;
			padding: 0 12px 0 20px;
			font-size: 16px;
			font-family: Roboto, Arial, sans-serif;
			color: var(--li-text);
			caret-color: var(--li-text);
			box-sizing: border-box;
		}

		.lockedin-search-input::placeholder {
			color: var(--li-subtext);
			opacity: 1;
		}

		.lockedin-clear-btn {
			border: none;
			background: transparent;
			cursor: pointer;
			padding: 0 10px;
			display: none;
			align-items: center;
			justify-content: center;
			color: var(--li-subtext);
			height: 100%;
			transition: color 0.15s;
		}

		.lockedin-clear-btn:hover {
			color: var(--li-text);
		}

		.lockedin-search-btn {
			width: 64px;
			height: 100%;
			border: none;
			border-left: 1px solid var(--li-border);
			background: var(--li-btn-bg);
			cursor: pointer;
			display: flex;
			align-items: center;
			justify-content: center;
			transition: background 0.15s;
			box-sizing: border-box;
			flex-shrink: 0;
			color: var(--li-text);
		}

		.lockedin-search-btn:hover {
			background: var(--li-btn-hover);
		}

		.lockedin-voice-btn {
			width: 44px;
			height: 44px;
			margin-left: 12px;
			border-radius: 50%;
			border: none;
			background: var(--li-btn-bg);
			cursor: pointer;
			display: flex;
			align-items: center;
			justify-content: center;
			transition: background 0.15s, transform 0.1s;
			flex-shrink: 0;
			color: var(--li-text);
		}

		.lockedin-voice-btn:hover {
			background: var(--li-btn-hover);
		}

		.lockedin-voice-btn:active {
			transform: scale(0.95);
		}

		.lockedin-suggestions-box {
			position: absolute;
			top: calc(100% + 6px);
			left: 0;
			width: calc(100% - 56px);
			background: var(--li-dropdown-bg);
			border: 1px solid var(--li-border);
			border-radius: 16px;
			box-shadow: 0 8px 24px var(--li-dropdown-shadow);
			padding: 8px 0;
			z-index: 10000;
			box-sizing: border-box;
			overflow: hidden;
		}

		.lockedin-suggestions-list {
			list-style: none;
			margin: 0;
			padding: 0;
			max-height: 380px;
			overflow-y: auto;
		}

		.lockedin-suggestion-item {
			display: flex;
			align-items: center;
			height: 40px;
			padding: 0 18px;
			cursor: pointer;
			font-family: Roboto, Arial, sans-serif;
			font-size: 15px;
			color: var(--li-text);
			transition: background 0.1s;
		}

		.lockedin-suggestion-item:hover,
		.lockedin-suggestion-item.active {
			background: var(--li-dropdown-hover);
		}

		.lockedin-suggestion-icon {
			margin-right: 14px;
			color: var(--li-subtext);
			display: flex;
			align-items: center;
			flex-shrink: 0;
		}

		.lockedin-suggestion-text {
			flex: 1;
			white-space: nowrap;
			overflow: hidden;
			text-overflow: ellipsis;
		}

		.lockedin-powered-by {
			font-family: Roboto, Arial, sans-serif;
			font-size: 12px;
			color: var(--li-powered);
			margin-top: 18px;
			letter-spacing: 0.2px;
			user-select: none;
			text-align: center;
		}
	`;
}

function removeSearchWidget() {
	const widget = document.getElementById(SEARCH_WIDGET_ID);
	if (widget) widget.remove();
	if (suggestDebounceTimer) {
		clearTimeout(suggestDebounceTimer);
		suggestDebounceTimer = null;
	}
	if (currentSuggestAbort) {
		currentSuggestAbort.abort();
		currentSuggestAbort = null;
	}
}

async function fetchYouTubeSuggestions(query) {
	if (!query || !query.trim()) return [];
	if (currentSuggestAbort) {
		currentSuggestAbort.abort();
	}
	currentSuggestAbort = new AbortController();
	try {
		const url = `https://suggestqueries-clients6.youtube.com/complete/search?client=chrome&ds=yt&q=${encodeURIComponent(query.trim())}`;
		const res = await fetch(url, { signal: currentSuggestAbort.signal });
		if (!res.ok) return [];
		const data = await res.json();
		return Array.isArray(data?.[1]) ? data[1] : [];
	} catch (e) {
		if (e.name === 'AbortError') return null;
		return [];
	}
}

function buildSearchWidget() {
	const isDark = isYouTubeDarkMode();

	const widget = document.createElement('div');
	widget.id = SEARCH_WIDGET_ID;
	if (isDark) widget.classList.add('lockedin-dark');

	const inner = document.createElement('div');
	inner.className = 'lockedin-widget-inner';

	// Logo box
	const logoBox = document.createElement('div');
	logoBox.className = 'lockedin-logo-box';

	function setupLogo() {
		const navLogo = document.querySelector('ytd-topbar-logo-renderer, a#logo, #logo');
		if (navLogo) {
			const clone = navLogo.cloneNode(true);
			clone.id = 'lockedin-cloned-logo';
			clone.removeAttribute('href');
			clone.querySelectorAll('a').forEach(a => {
				a.removeAttribute('href');
				a.style.cursor = 'default';
				a.onclick = e => {
					e.preventDefault();
					e.stopPropagation();
				};
			});
			clone.style.cssText = `
				display: flex !important;
				align-items: center !important;
				justify-content: center !important;
				transform: scale(2.2);
				transform-origin: center center;
				pointer-events: none;
				user-select: none;
			`;
			logoBox.innerHTML = '';
			logoBox.appendChild(clone);
			return true;
		}

		// Fallback SVG logo while navLogo is loading
		logoBox.innerHTML = `
			<div style="display:flex;align-items:center;justify-content:center;transform:scale(2.2);transform-origin:center center;user-select:none;">
				<svg viewBox="0 0 90 20" width="90" height="20" style="display:block;">
					<path d="M27.9727 3.12324C27.6435 1.89323 26.6768 0.926623 25.4468 0.597366C23.2197 2.24288e-07 14.285 0 14.285 0C14.285 0 5.35042 2.24288e-07 3.12323 0.597366C1.89323 0.926623 0.926623 1.89323 0.597366 3.12324C2.24288e-07 5.35042 0 10 0 10C0 10 2.24288e-07 14.6496 0.597366 16.8768C0.926623 18.1068 1.89323 19.0734 3.12323 19.4026C5.35042 20 14.285 20 14.285 20C14.285 20 23.2197 20 25.4468 19.4026C26.6768 19.0734 27.6435 18.1068 27.9727 16.8768C28.5701 14.6496 28.5701 10 28.5701 10C28.5701 10 28.5677 5.35042 27.9727 3.12324Z" fill="#FF0000"/>
					<path d="M11.4253 14.2854L18.8477 10.0004L11.4253 5.71533V14.2854Z" fill="white"/>
				</svg>
				<span style="font-family:'YouTube Noto',Roboto,Arial,sans-serif;font-size:20px;font-weight:600;letter-spacing:-0.5px;color:var(--li-text);margin-left:6px;line-height:1;">YouTube</span>
			</div>
		`;
		return false;
	}

	if (!setupLogo()) {
		let retries = 0;
		const retryTimer = setInterval(() => {
			retries++;
			if (setupLogo() || retries >= 8 || !document.getElementById(SEARCH_WIDGET_ID)) {
				clearInterval(retryTimer);
			}
		}, 250);
	}

	// Search form
	const form = document.createElement('form');
	form.className = 'lockedin-search-form';
	form.setAttribute('role', 'search');

	const searchBar = document.createElement('div');
	searchBar.className = 'lockedin-search-bar';

	const searchInput = document.createElement('input');
	searchInput.type = 'text';
	searchInput.className = 'lockedin-search-input';
	searchInput.placeholder = 'Search';
	searchInput.setAttribute('aria-label', 'Search');
	searchInput.setAttribute('autocomplete', 'off');
	searchInput.setAttribute('spellcheck', 'false');

	const clearBtn = document.createElement('button');
	clearBtn.type = 'button';
	clearBtn.className = 'lockedin-clear-btn';
	clearBtn.setAttribute('aria-label', 'Clear search');
	clearBtn.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>`;

	const searchBtn = document.createElement('button');
	searchBtn.type = 'submit';
	searchBtn.className = 'lockedin-search-btn';
	searchBtn.setAttribute('aria-label', 'Search');
	searchBtn.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>`;

	searchBar.appendChild(searchInput);
	searchBar.appendChild(clearBtn);
	searchBar.appendChild(searchBtn);

	// Voice search button
	const voiceBtn = document.createElement('button');
	voiceBtn.type = 'button';
	voiceBtn.className = 'lockedin-voice-btn';
	voiceBtn.setAttribute('aria-label', 'Search with your voice');
	voiceBtn.title = 'Search with your voice';
	voiceBtn.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="currentColor"><path d="M12 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3z"/><path d="M17 11c0 2.76-2.24 5-5 5s-5-2.24-5-5H5c0 3.53 2.61 6.43 6 6.92V21h2v-3.08c3.39-.49 6-3.39 6-6.92h-2z"/></svg>`;

	// Suggestions box
	const suggestionsBox = document.createElement('div');
	suggestionsBox.className = 'lockedin-suggestions-box';
	suggestionsBox.style.display = 'none';

	const suggestionsList = document.createElement('ul');
	suggestionsList.className = 'lockedin-suggestions-list';
	suggestionsBox.appendChild(suggestionsList);

	form.appendChild(searchBar);
	form.appendChild(voiceBtn);
	form.appendChild(suggestionsBox);

	// Autocomplete state
	let currentSuggestions = [];
	let selectedIndex = -1;
	let originalQuery = '';

	function closeSuggestions() {
		suggestionsBox.style.display = 'none';
		suggestionsList.innerHTML = '';
		currentSuggestions = [];
		selectedIndex = -1;
	}

	function executeSearch(query) {
		const trimmed = (query || '').trim();
		if (!trimmed) return;
		removeSearchWidget();
		removeSearchWidgetCSS();
		window.location.href = `https://www.youtube.com/results?search_query=${encodeURIComponent(trimmed)}`;
	}

	function renderSuggestions(suggestions, query) {
		currentSuggestions = suggestions || [];
		selectedIndex = -1;
		originalQuery = query;

		if (!currentSuggestions.length) {
			closeSuggestions();
			return;
		}

		suggestionsList.innerHTML = '';
		currentSuggestions.forEach((item, idx) => {
			const li = document.createElement('li');
			li.className = 'lockedin-suggestion-item';

			const icon = document.createElement('span');
			icon.className = 'lockedin-suggestion-icon';
			icon.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>`;

			const text = document.createElement('span');
			text.className = 'lockedin-suggestion-text';
			text.textContent = item;

			li.appendChild(icon);
			li.appendChild(text);

			li.addEventListener('mousedown', (e) => {
				e.preventDefault();
				executeSearch(item);
			});

			suggestionsList.appendChild(li);
		});

		suggestionsBox.style.display = 'block';
	}

	function updateActiveSuggestion() {
		const items = suggestionsList.querySelectorAll('.lockedin-suggestion-item');
		items.forEach((item, idx) => {
			if (idx === selectedIndex) {
				item.classList.add('active');
				item.scrollIntoView({ block: 'nearest' });
			} else {
				item.classList.remove('active');
			}
		});

		if (selectedIndex >= 0 && selectedIndex < currentSuggestions.length) {
			searchInput.value = currentSuggestions[selectedIndex];
		} else {
			searchInput.value = originalQuery;
		}
	}

	// Input listeners
	searchInput.addEventListener('input', () => {
		const val = searchInput.value;
		clearBtn.style.display = val ? 'flex' : 'none';

		if (suggestDebounceTimer) clearTimeout(suggestDebounceTimer);
		if (!val.trim()) {
			closeSuggestions();
			return;
		}

		suggestDebounceTimer = setTimeout(async () => {
			const results = await fetchYouTubeSuggestions(val);
			if (results !== null && searchInput.value.trim() === val.trim()) {
				renderSuggestions(results, val);
			}
		}, 150);
	});

	searchInput.addEventListener('keydown', (e) => {
		if (e.key === 'ArrowDown') {
			if (currentSuggestions.length > 0) {
				e.preventDefault();
				selectedIndex = (selectedIndex + 1) % currentSuggestions.length;
				updateActiveSuggestion();
			}
		} else if (e.key === 'ArrowUp') {
			if (currentSuggestions.length > 0) {
				e.preventDefault();
				selectedIndex = selectedIndex <= 0 ? currentSuggestions.length - 1 : selectedIndex - 1;
				updateActiveSuggestion();
			}
		} else if (e.key === 'Escape') {
			closeSuggestions();
		}
	});

	searchInput.addEventListener('focus', () => {
		if (searchInput.value.trim() && currentSuggestions.length > 0) {
			suggestionsBox.style.display = 'block';
		}
	});

	clearBtn.addEventListener('click', () => {
		searchInput.value = '';
		clearBtn.style.display = 'none';
		closeSuggestions();
		searchInput.focus();
	});

	form.addEventListener('submit', (e) => {
		e.preventDefault();
		executeSearch(searchInput.value);
	});

	// Close suggestions on outside click
	const outsideClickListener = (e) => {
		if (!form.contains(e.target)) {
			closeSuggestions();
		}
	};
	document.addEventListener('click', outsideClickListener);

	// Voice search
	voiceBtn.addEventListener('click', () => {
		// 1. Try native YouTube voice search dialog
		const nativeVoice = document.querySelector('ytd-masthead #voice-search-button button, #voice-search-button button, ytd-masthead #voice-search-button');
		if (nativeVoice) {
			nativeVoice.click();
			return;
		}

		// 2. Fallback to Web Speech API
		const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
		if (!SpeechRecognition) {
			searchInput.focus();
			return;
		}

		const recognition = new SpeechRecognition();
		recognition.lang = navigator.language || 'en-US';
		recognition.interimResults = false;
		recognition.maxAlternatives = 1;

		const originalPlaceholder = searchInput.placeholder;
		searchInput.placeholder = 'Listening…';
		searchInput.disabled = true;

		recognition.onresult = (event) => {
			const transcript = event.results?.[0]?.[0]?.transcript;
			searchInput.disabled = false;
			searchInput.placeholder = originalPlaceholder;
			if (transcript && transcript.trim()) {
				searchInput.value = transcript.trim();
				executeSearch(transcript.trim());
			}
		};

		recognition.onerror = () => {
			searchInput.disabled = false;
			searchInput.placeholder = originalPlaceholder;
			searchInput.focus();
		};

		recognition.onend = () => {
			searchInput.disabled = false;
			searchInput.placeholder = originalPlaceholder;
		};

		try {
			recognition.start();
		} catch (e) {
			searchInput.disabled = false;
			searchInput.placeholder = originalPlaceholder;
		}
	});

	// Powered by LockedIn label
	const poweredBy = document.createElement('div');
	poweredBy.className = 'lockedin-powered-by';
	poweredBy.textContent = 'Powered by LockedIn';

	inner.appendChild(logoBox);
	inner.appendChild(form);
	inner.appendChild(poweredBy);
	widget.appendChild(inner);

	return widget;
}

function insertSearchWidgetIntoDOM(widget) {
	const primary = document.querySelector('ytd-browse[page-subtype="home"] #primary');
	if (primary) {
		primary.prepend(widget);
		return;
	}

	const browseHome = document.querySelector('ytd-browse[page-subtype="home"]');
	if (browseHome) {
		browseHome.prepend(widget);
		return;
	}

	const ytmBrowse = document.querySelector('ytm-browse');
	if (ytmBrowse) {
		ytmBrowse.prepend(widget);
		return;
	}

	const pageManager = document.querySelector('ytd-page-manager');
	if (pageManager) {
		pageManager.prepend(widget);
		return;
	}

	document.body.prepend(widget);
}

function ensureNavTeardownListener() {
	if (_navListenerAttached) return;
	_navListenerAttached = true;

	function onNavStart() {
		if (!isHomePath()) {
			removeSearchWidget();
			removeSearchWidgetCSS();
		}
	}

	function onNavFinish() {
		if (!isHomePath()) {
			removeSearchWidget();
			removeSearchWidgetCSS();
		} else if (latestSyncedSettings.hideFeed) {
			hideFeed(true);
		}
	}

	window.addEventListener('yt-navigate-start', onNavStart, true);
	window.addEventListener('yt-navigate-finish', onNavFinish, true);
	window.addEventListener('popstate', onNavFinish, true);
}

function hideFeed(shouldHide) {
	if (!shouldHide) {
		// Restore feed elements
		[
			document.querySelector('ytd-rich-grid-renderer'),
			document.querySelector('ytd-two-column-browse-results-renderer'),
			document.querySelector('ytd-browse[page-subtype="home"] #header'),
			document.querySelector('ytd-browse[page-subtype="home"] #contents'),
			...document.querySelectorAll('[data-lockedin-hidden="feed"]'),
		].filter(Boolean).forEach(el => {
			el.style.removeProperty('display');
			el.removeAttribute('data-lockedin-hidden');
		});

		removeSearchWidget();
		removeSearchWidgetCSS();
		return;
	}

	if (isHomePath()) {
		// Hide feed video elements and chip bar via attribute
		[
			'ytd-browse[page-subtype="home"] ytd-rich-grid-renderer',
			'ytd-browse[page-subtype="home"] #header',
			'ytd-browse[page-subtype="home"] ytd-feed-filter-chip-bar-renderer',
			'ytm-browse ytm-rich-grid-renderer',
			'ytm-browse ytm-feed',
		].forEach(selector => {
			document.querySelectorAll(selector).forEach(el => {
				if (!el.hasAttribute('data-lockedin-hidden')) {
					el.style.setProperty('display', 'none', 'important');
					el.setAttribute('data-lockedin-hidden', 'feed');
				}
			});
		});

		// Inject instant hiding CSS for smooth zero-flicker feed hiding
		injectSearchWidgetCSS();

		// Attach navigation listeners to tear down when leaving homepage
		ensureNavTeardownListener();

		// If user disabled the search widget, leave page blank
		if (latestSyncedSettings.showFeedSearchWidget === false) {
			removeSearchWidget();
			return;
		}

		// Inject search widget if not already present
		if (!document.getElementById(SEARCH_WIDGET_ID)) {
			const widget = buildSearchWidget();
			insertSearchWidgetIntoDOM(widget);
		}
	} else {
		// Not on homepage — remove immediately
		removeSearchWidget();
		removeSearchWidgetCSS();
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
