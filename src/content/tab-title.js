// ===== BROWSER TAB TITLE MODULE =====

// YouTube prefixes the tab title with the unread notification count, for example:
//   "(3) YouTube"
//   "(3) VIDEO TITLE - YouTube"
//   "(3) Subscriptions - YouTube"
// The counter is localized, so match any Unicode digits as well as the common
// full-width bracket variants instead of relying on a specific language.
const TAB_TITLE_NOTIFICATION_PREFIX = /^\s*[\(\uFF08\u3010\uFF3B\[]\s*\+?\s*\p{Nd}(?:[\p{Nd}\s.,'’]*\p{Nd})?\+?\s*[\)\uFF09\u3011\uFF3D\]]\s*/u;

const TAB_TITLE_HIDE_ATTR = 'data-lockedin-hide-tab-count';
const TAB_TITLE_READY_ATTR = 'data-lockedin-tab-title-ready';

let tabTitleObserver = null;
let tabTitleScriptInjected = false;
let tabTitleLastKnownPrefix = null;

function stripTabTitleNotificationCount(title) {
	if (typeof title !== 'string' || !title) return title;
	return title.replace(TAB_TITLE_NOTIFICATION_PREFIX, '');
}

function shouldHideTabTitleNotificationCount() {
	return Boolean(
		latestSyncedSettings &&
		latestSyncedSettings.extensionEnabled !== false &&
		latestSyncedSettings.hideTabNotificationCount
	);
}

function isTabTitleStripperReady() {
	return Boolean(
		document.documentElement &&
		document.documentElement.getAttribute(TAB_TITLE_READY_ATTR) === 'true'
	);
}

function getNotificationCountFromDOM() {
	try {
		const badge = document.querySelector(
			'ytd-notification-topbar-button-renderer .yt-spec-icon-badge-shape__badge, ' +
			'ytd-notification-topbar-button-renderer #notification-count, ' +
			'ytm-notification-topbar-button-renderer .yt-spec-icon-badge-shape__badge, ' +
			'.yt-spec-icon-badge-shape__badge'
		);
		if (badge) {
			const text = (badge.textContent || '').trim();
			if (text) return text;
		}

		const btn = document.querySelector(
			'ytd-notification-topbar-button-renderer button[aria-label], ' +
			'ytd-notification-topbar-button-renderer yt-icon-button[aria-label]'
		);
		if (btn) {
			const label = btn.getAttribute('aria-label') || '';
			const match = label.match(/[\(\[\{（【]?\s*(\d+\+?|\p{Nd}+\+?)\s*[\)\]\}）】]?/u);
			if (match && match[1]) return match[1];
		}
	} catch (e) {
		// Ignore DOM query errors
	}
	return null;
}

function injectTabTitleScript() {
	if (tabTitleScriptInjected) return;
	tabTitleScriptInjected = true;

	const script = document.createElement('script');
	script.src = browser.runtime.getURL('content/tab-title-inject.js');
	(document.head || document.documentElement).appendChild(script);
	script.onload = () => {
		script.remove();
		applyTabTitleVisibility();
	};
}

function applyTabTitleVisibility() {
	if (typeof document === 'undefined') return;

	const shouldHide = shouldHideTabTitleNotificationCount();
	setRootFlag(TAB_TITLE_HIDE_ATTR, shouldHide);

	const currentTitle = document.title;
	if (currentTitle) {
		const prefixMatch = currentTitle.match(TAB_TITLE_NOTIFICATION_PREFIX);
		if (prefixMatch) {
			tabTitleLastKnownPrefix = prefixMatch[0];
		}
	}

	if (!shouldHide) {
		// When unhidden, ensure the title is restored even if main-world couldn't or wasn't loaded
		if (document.title && !TAB_TITLE_NOTIFICATION_PREFIX.test(document.title)) {
			if (tabTitleLastKnownPrefix) {
				document.title = tabTitleLastKnownPrefix + document.title;
			} else {
				const count = getNotificationCountFromDOM();
				if (count) {
					document.title = `(${count}) ${document.title}`;
				}
			}
		}
		return;
	}

	// When hiding: if main-world script is already active, it handles it synchronously
	if (isTabTitleStripperReady()) return;

	if (!currentTitle) return;

	const strippedTitle = stripTabTitleNotificationCount(currentTitle);
	if (strippedTitle === currentTitle || !strippedTitle) return;

	document.title = strippedTitle;
}

function observeTabTitle() {
	if (tabTitleObserver || typeof MutationObserver === 'undefined') return;

	const target = document.querySelector('head') || document.documentElement;
	if (!target) return;

	tabTitleObserver = new MutationObserver(() => {
		applyTabTitleVisibility();
	});
	tabTitleObserver.observe(target, { childList: true, subtree: true, characterData: true });
}

function initTabTitleWatcher() {
	injectTabTitleScript();
	observeTabTitle();
	applyTabTitleVisibility();

	const spaEvents = [
		'yt-navigate-finish',
		'yt-page-data-updated',
		'yt-page-type-changed',
		'spdone'
	];

	spaEvents.forEach((eventName) => {
		window.addEventListener(eventName, () => applyTabTitleVisibility(), true);
	});
	window.addEventListener('load', () => applyTabTitleVisibility(), true);
	window.addEventListener('pageshow', () => applyTabTitleVisibility(), true);
}

initTabTitleWatcher();
