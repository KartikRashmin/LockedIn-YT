// ===== TAB TITLE NOTIFICATION COUNT STRIPPER (MAIN WORLD) =====
// This script runs in the PAGE's main world so it can intercept YouTube's
// document.title assignments synchronously, before the browser paints the
// notification count into the tab title.
(function () {
	'use strict';

	var HIDE_ATTR = 'data-lockedin-hide-tab-count';
	var READY_ATTR = 'data-lockedin-tab-title-ready';

	// Same localized counter pattern used by the content script fallback.
	var PREFIX = /^\s*[\(\uFF08\u3010\uFF3B\[]\s*\+?\s*\p{Nd}(?:[\p{Nd}\s.,'’]*\p{Nd})?\+?\s*[\)\uFF09\u3011\uFF3D\]]\s*/u;

	var proto = Document.prototype;
	var descriptor = null;
	while (proto && !(descriptor = Object.getOwnPropertyDescriptor(proto, 'title'))) {
		proto = Object.getPrototypeOf(proto);
	}

	if (!descriptor || typeof descriptor.get !== 'function' || typeof descriptor.set !== 'function') {
		return;
	}
	if (Document.prototype.__lockedinTabTitlePatched) {
		return;
	}

	var lastCapturedPrefix = null;
	var lastWrittenTitle = null;

	function isEnabled() {
		return document.documentElement &&
			document.documentElement.getAttribute(HIDE_ATTR) === 'true';
	}

	function extractPrefix(title) {
		if (typeof title !== 'string' || !title) return null;
		var match = title.match(PREFIX);
		return match ? match[0] : null;
	}

	function stripTitleNotificationCount(title) {
		if (typeof title !== 'string' || !title) return title;
		var stripped = title.replace(PREFIX, '');
		return stripped || title;
	}

	function getTitle() {
		return descriptor.get.call(document);
	}

	function setTitle(title) {
		lastWrittenTitle = title;
		descriptor.set.call(document, title);
	}

	function getCountFromDOM() {
		try {
			var badge = document.querySelector(
				'ytd-notification-topbar-button-renderer .yt-spec-icon-badge-shape__badge, ' +
				'ytd-notification-topbar-button-renderer #notification-count, ' +
				'ytm-notification-topbar-button-renderer .yt-spec-icon-badge-shape__badge, ' +
				'.yt-spec-icon-badge-shape__badge'
			);
			if (badge) {
				var text = (badge.textContent || '').trim();
				if (text) return text;
			}
			var btn = document.querySelector(
				'ytd-notification-topbar-button-renderer button[aria-label], ' +
				'ytd-notification-topbar-button-renderer yt-icon-button[aria-label]'
			);
			if (btn) {
				var label = btn.getAttribute('aria-label') || '';
				var match = label.match(/[\(\[\{（【]?\s*(\d+\+?|\p{Nd}+\+?)\s*[\)\]\}）】]?/u);
				if (match && match[1]) return match[1];
			}
		} catch (e) {
			// Ignore DOM query issues
		}
		return null;
	}

	function applyCurrentTitle() {
		var currentTitle = getTitle();
		if (!currentTitle) return;

		var prefix = extractPrefix(currentTitle);
		if (prefix) {
			lastCapturedPrefix = prefix;
			var strippedTitle = stripTitleNotificationCount(currentTitle);
			setTitle(strippedTitle);
		}
	}

	function restoreTitle() {
		var currentTitle = getTitle();
		if (!currentTitle) return;

		// If current title already has a prefix, nothing to restore
		if (extractPrefix(currentTitle)) return;

		// 1. Try to restore using last known prefix (e.g. "(3) ")
		if (lastCapturedPrefix) {
			setTitle(lastCapturedPrefix + currentTitle);
			return;
		}

		// 2. Fallback: try to read count from DOM badge if available
		var count = getCountFromDOM();
		if (count) {
			setTitle('(' + count + ') ' + currentTitle);
		}
	}

	Object.defineProperty(Document.prototype, 'title', {
		configurable: true,
		enumerable: descriptor.enumerable,
		get: function () {
			return descriptor.get.call(this);
		},
		set: function (value) {
			var prefix = extractPrefix(value);
			if (prefix) {
				lastCapturedPrefix = prefix;
			}

			if (!isEnabled()) {
				descriptor.set.call(this, value);
				return;
			}

			if (prefix) {
				var stripped = stripTitleNotificationCount(value);
				setTitle(stripped);
			} else {
				descriptor.set.call(this, value);
			}
		}
	});
	Document.prototype.__lockedinTabTitlePatched = true;

	function isTitleMutation(mutation) {
		if (mutation.type === 'characterData') {
			return Boolean(mutation.target.parentNode && mutation.target.parentNode.nodeName === 'TITLE');
		}
		if (mutation.target && mutation.target.nodeName === 'TITLE') {
			return true;
		}
		if (mutation.type === 'childList') {
			var nodes = Array.prototype.slice.call(mutation.addedNodes)
				.concat(Array.prototype.slice.call(mutation.removedNodes));
			return nodes.some(function (node) { return node.nodeName === 'TITLE'; });
		}
		return false;
	}

	// Catch title changes that bypass document.title and write to <title> directly.
	var titleObserver = new MutationObserver(function (mutations) {
		if (!mutations.some(isTitleMutation)) return;

		if (lastWrittenTitle !== null) {
			var wasOwnWrite = getTitle() === lastWrittenTitle;
			lastWrittenTitle = null;
			if (wasOwnWrite) return;
		}

		if (!isEnabled()) return;
		applyCurrentTitle();
	});

	// Strip or restore immediately when the setting changes.
	var attrObserver = new MutationObserver(function () {
		if (isEnabled()) {
			applyCurrentTitle();
		} else {
			restoreTitle();
		}
	});

	var observeTarget = document.querySelector('head') || document.documentElement;
	if (observeTarget) {
		titleObserver.observe(observeTarget, { childList: true, subtree: true, characterData: true });
	}

	if (document.documentElement) {
		attrObserver.observe(document.documentElement, {
			attributes: true,
			attributeFilter: [HIDE_ATTR]
		});
		document.documentElement.setAttribute(READY_ATTR, 'true');
	}

	// Handle a title that was already present when this script was injected.
	if (isEnabled()) {
		applyCurrentTitle();
	}
})();
