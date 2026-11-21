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

	if (!shouldHide) {
		// The main-world script restores the counter when the attribute is removed.
		return;
	}

	// When the main-world script is active it strips titles synchronously.
	if (isTabTitleStripperReady()) return;

	const currentTitle = document.title;
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
