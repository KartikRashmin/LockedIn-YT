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

	var lastOriginal = null;
	var lastStripped = null;
	var lastWrittenTitle = null;

	function isEnabled() {
		return document.documentElement &&
			document.documentElement.getAttribute(HIDE_ATTR) === 'true';
	}

	function stripTitleNotificationCount(title) {
		if (typeof title !== 'string' || !title) return title;
		var stripped = title.replace(PREFIX, '');
		if (!stripped || stripped === title) return title;
		return stripped;
	}

	function getTitle() {
		return descriptor.get.call(document);
	}

	function setTitle(title) {
		lastWrittenTitle = title;
		descriptor.set.call(document, title);
	}

	function applyCurrentTitle() {
		var currentTitle = getTitle();
		var strippedTitle = stripTitleNotificationCount(currentTitle);
		if (strippedTitle === currentTitle) {
			lastOriginal = null;
			lastStripped = null;
			return;
		}
		lastOriginal = currentTitle;
		lastStripped = strippedTitle;
		setTitle(strippedTitle);
	}

	function restoreTitle() {
		if (lastOriginal !== null && lastStripped !== null && getTitle() === lastStripped) {
			setTitle(lastOriginal);
		}
		lastOriginal = null;
		lastStripped = null;
	}

	Object.defineProperty(Document.prototype, 'title', {
		configurable: true,
		enumerable: descriptor.enumerable,
		get: function () {
			return descriptor.get.call(this);
		},
		set: function (value) {
			if (!isEnabled()) {
				lastOriginal = null;
				lastStripped = null;
				descriptor.set.call(this, value);
				return;
			}

			var strippedTitle = stripTitleNotificationCount(value);
			if (strippedTitle === value) {
				// An external title update without a counter: drop any snapshot
				// so a removed count is never restored later.
				lastOriginal = null;
				lastStripped = null;
				descriptor.set.call(this, value);
				return;
			}

			lastOriginal = value;
			lastStripped = strippedTitle;
			setTitle(strippedTitle);
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
