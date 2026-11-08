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

// ===== YOUTUBE SEARCH WIDGET (CSS-REPOSITION MODE) =====
//
// We do NOT move #center in the DOM. Instead we use CSS position:fixed
// to visually place it at screen-centre while it stays inside ytd-masthead.
// This preserves ALL of YouTube's JS wiring — autocomplete suggestions,
// voice-search, keyboard shortcuts — because the element's DOM context
// is unchanged.
//
// Layout (all position:fixed, relative to viewport centre):
//
//   ┌──────────────────────────┐
//   │  YouTube logo  (~40px)   │  top: calc(50% - 60px)
//   │                          │
//   │  [  Search bar  ] 🎤     │  centre: 50%  (via CSS on #center)
//   │                          │
//   │  Powered by LockedIn     │  top: calc(50% + 60px)
//   └──────────────────────────┘

const WIDGET_ID   = 'lockedin-feed-placeholder';
const CSS_REPOS_ID = 'lockedin-center-reposition'; // <style> for #center CSS
const CSS_WIDGET_ID = 'lockedin-search-widget-styles'; // <style> for slot tweaks

// Selectors for the logo in the top-left of the nav
const NAV_LOGO_SELECTORS = [
	'#start ytd-logo',
	'ytd-masthead #start ytd-logo',
	'ytd-logo',
	'#start a[href="/"]',
	'#logo-icon-container',
];

// Clone the visible nav logo (we clone, not move, so the nav keeps its logo)
function cloneNavLogo() {
	for (const sel of NAV_LOGO_SELECTORS) {
		const el = document.querySelector(sel);
		if (!el) continue;
		try {
			const clone = el.cloneNode(true);
			clone.querySelectorAll('a').forEach(a => {
				a.removeAttribute('href');
				a.style.cursor = 'default';
				a.style.pointerEvents = 'none';
			});
			clone.style.pointerEvents = 'none';
			return clone;
		} catch (e) { /* try next */ }
	}
	return null;
}

// Inject (or update) the <style> that CSS-repositions #center to screen-centre.
// The search bar's midpoint sits at exactly 50% of the viewport height.
// Logo is 60px above that; "Powered by" is 60px below.
function injectRepositionCSS() {
	let style = document.getElementById(CSS_REPOS_ID);
	if (!style) {
		style = document.createElement('style');
		style.id = CSS_REPOS_ID;
		(document.head || document.documentElement).appendChild(style);
	}
	style.textContent = `
		/* ===== LockedIn: reposition search bar to viewport centre ===== */

		/* Pull #center out of the masthead flow and fix it at screen-centre */
		ytd-masthead #center,
		#masthead-container #center,
		#masthead #center {
			position: fixed !important;
			top:  50% !important;
			left: 50% !important;
			transform: translate(-50%, -50%) !important;
			width:     min(580px, 90vw) !important;
			max-width: 90vw !important;
			min-width: 0    !important;
			margin:    0    !important;
			padding:   0    !important;
			flex:      none !important;
			z-index:   2001 !important;
			display:   flex !important;
			align-items: center !important;
		}

		/* Make the searchbox inside fill the available width */
		ytd-masthead #center ytd-searchbox,
		#masthead #center ytd-searchbox,
		ytd-masthead #center #search-container,
		ytd-masthead #center #search-form {
			width:     100% !important;
			max-width: 100% !important;
			flex:      1    !important;
		}

		/* Keep the autocomplete suggestion dropdown visible & above overlay */
		ytd-masthead #center ytd-searchbox #suggestions-popup,
		ytd-masthead #center ytd-searchbox tp-yt-iron-dropdown,
		ytd-masthead #center [slot="suggestions"] {
			z-index: 2002 !important;
		}
	`;
}

function removeRepositionCSS() {
	const s = document.getElementById(CSS_REPOS_ID);
	if (s) s.remove();
}

// Build the overlay that shows the logo and "Powered by LockedIn".
// #center is NOT inside this overlay — it is CSS-repositioned separately.
function createSearchWidget() {
	const isDark = isYouTubeDarkMode();

	// Full-screen transparent backdrop (pointer-events:none so clicks pass through)
	const wrapper = document.createElement('div');
	wrapper.id = WIDGET_ID;
	wrapper.style.cssText = `
		position: fixed;
		inset: 0;
		pointer-events: none;
		z-index: 2000;
		background: transparent;
	`;

	// --- Logo (position:fixed, 60px above search-bar centre) ---
	const logoWrap = document.createElement('div');
	logoWrap.style.cssText = `
		position: fixed;
		top:  calc(50% - 60px);
		left: 50%;
		transform: translate(-50%, -50%);
		pointer-events: none;
		display: flex;
		align-items: center;
		justify-content: center;
	`;

	const logoClone = cloneNavLogo();
	if (logoClone) {
		// Scale the nav logo up — it is ~18-20 px tall in the bar, we want ~38 px
		const scaleWrap = document.createElement('div');
		scaleWrap.style.cssText = `
			transform: scale(2);
			transform-origin: center center;
			pointer-events: none;
			display: flex;
			align-items: center;
		`;
		scaleWrap.appendChild(logoClone);

		// Outer box reserves space for the scaled element
		const logoOuter = document.createElement('div');
		logoOuter.style.cssText = `
			display: flex;
			align-items: center;
			justify-content: center;
			height: 40px;
			min-width: 180px;
		`;
		logoOuter.appendChild(scaleWrap);
		logoWrap.appendChild(logoOuter);
	} else {
		// Fallback inline SVG (play button + wordmark)
		logoWrap.innerHTML = `
			<svg viewBox="0 0 203 46" width="203" height="46"
			     xmlns="http://www.w3.org/2000/svg" aria-label="YouTube">
				<path d="M64.14 8.19A8.08 8.08 0 0 0 58.49 2.5C53.37 1.1 32.86 1.1 32.86 1.1
				         S12.35 1.1 7.23 2.5a8.08 8.08 0 0 0-5.65 5.69C.17 13.37.17 23 .17 23
				         s0 9.63 1.41 14.81a8.08 8.08 0 0 0 5.65 5.69
				         c5.12 1.4 25.63 1.4 25.63 1.4s20.51 0 25.63-1.4
				         a8.08 8.08 0 0 0 5.65-5.69C65.55 32.63 65.55 23 65.55 23
				         s0-9.63-1.41-14.81z" fill="#FF0000"/>
				<path d="M26.44 32.86L43.14 23 26.44 13.14v19.72z" fill="#fff"/>
				<text x="74" y="34"
				      font-family="'YouTube Noto',Roboto,Arial,sans-serif"
				      font-size="30" font-weight="500" letter-spacing="-0.75"
				      fill="${isDark ? '#fff' : '#030303'}">YouTube</text>
			</svg>`;
	}

	// --- "Powered by LockedIn" label (60px below search-bar centre) ---
	const poweredBy = document.createElement('div');
	poweredBy.textContent = 'Powered by LockedIn';
	poweredBy.style.cssText = `
		position: fixed;
		top:  calc(50% + 60px);
		left: 50%;
		transform: translateX(-50%);
		font-family: Roboto, Arial, sans-serif;
		font-size: 12px;
		color: ${isDark ? 'rgba(255,255,255,0.4)' : 'rgba(0,0,0,0.4)'};
		user-select: none;
		pointer-events: none;
		white-space: nowrap;
	`;

	wrapper.appendChild(logoWrap);
	wrapper.appendChild(poweredBy);

	return wrapper;
}

// Teardown: remove overlay + reposition CSS.
// Called on restore OR on any navigation away from home.
function teardownSearchWidget() {
	const placeholder = document.getElementById(WIDGET_ID);
	if (placeholder) placeholder.remove();
	removeRepositionCSS();
	// Also remove any old search-widget-styles if present
	const old = document.getElementById(CSS_WIDGET_ID);
	if (old) old.remove();
}

// One-time navigation listener — tears down widget the moment the user
// navigates away (e.g. submits a search) so it never overlaps search results.
let _navListenerAttached = false;
function ensureNavTeardownListener() {
	if (_navListenerAttached) return;
	_navListenerAttached = true;

	function onNavigate() {
		// Tear down immediately if we just left the homepage
		if (!isHomePath()) {
			teardownSearchWidget();
		}
	}

	// yt-navigate-start fires as soon as navigation begins (before content changes)
	window.addEventListener('yt-navigate-start',  onNavigate, true);
	window.addEventListener('yt-navigate-finish', onNavigate, true);
}

// Logo-clone retry: if ytd-logo wasn't in DOM when widget was first created,
// swap the fallback SVG for the real clone once it appears.
let _logoRetryTimer = null;
function scheduleLogoRetry() {
	if (_logoRetryTimer) return;
	let attempts = 0;
	_logoRetryTimer = setInterval(() => {
		attempts++;
		const clone = cloneNavLogo();
		const wrapper = document.getElementById(WIDGET_ID);
		if (!wrapper || attempts >= 20) {
			clearInterval(_logoRetryTimer);
			_logoRetryTimer = null;
			return;
		}
		if (clone) {
			// Real logo is now available — rebuild the logo section
			clearInterval(_logoRetryTimer);
			_logoRetryTimer = null;
			// Re-create widget with real logo
			teardownSearchWidget();
			hideFeed(true);
		}
	}, 250);
}

function hideFeed(shouldHide) {
	if (!shouldHide) {
		// Restore feed elements
		[
			document.querySelector('ytd-rich-grid-renderer'),
			document.querySelector('ytd-two-column-browse-results-renderer'),
			...document.querySelectorAll('[data-lockedin-hidden="feed"]')
		].filter(Boolean).forEach(el => {
			el.style.removeProperty('display');
			el.removeAttribute('data-lockedin-hidden');
		});

		teardownSearchWidget();
		return;
	}

	if (isHomePath()) {
		// Hide feed content
		[
			'ytd-rich-grid-renderer',
			'ytd-two-column-browse-results-renderer #primary',
			'ytd-browse[page-subtype="home"]',
			'ytm-browse',
			'ytm-rich-grid-renderer',
			'ytm-feed',
		].forEach(selector => {
			document.querySelectorAll(selector).forEach(el => {
				if (!el.hasAttribute('data-lockedin-hidden')) {
					el.style.setProperty('display', 'none', 'important');
					el.setAttribute('data-lockedin-hidden', 'feed');
				}
			});
		});

		// If the user turned off the search widget, just hide the feed — no overlay
		if (latestSyncedSettings.showFeedSearchWidget === false) {
			teardownSearchWidget();
			return;
		}

		// Inject the CSS that visually moves #center to screen-centre
		injectRepositionCSS();

		// Create the logo + "Powered by" overlay if not already present
		if (!document.getElementById(WIDGET_ID)) {
			const widget = createSearchWidget();
			document.body.appendChild(widget);
			console.log('LockedIn: Search widget shown');

			// If logo clone fell back to SVG, retry once ytd-logo is available
			const hasRealLogo = !!document.querySelector(NAV_LOGO_SELECTORS[0]);
			if (!hasRealLogo) scheduleLogoRetry();
		}

		// Attach the navigation listener that tears down widget on page change
		ensureNavTeardownListener();

	} else {
		// Not on homepage — remove everything immediately
		teardownSearchWidget();
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
