// ===== NAVBAR MODULE =====

const NOTIFICATION_BELL_SELECTORS = [
	'ytd-notification-topbar-button-renderer',
	'#notification-button',
	'ytm-notification-topbar-button-renderer',
	'ytm-pivot-bar-item-renderer:has(a[href*="/notifications"])',
	'ytm-pivot-bar-item-renderer:has([data-pivot-id="notifications"])',
	'ytd-topbar-menu-button-renderer:has([aria-label*="Notifications" i])'
];

const CREATE_BUTTON_SELECTORS = [
	'ytd-masthead #buttons ytd-button-renderer:has(a[href*="studio.youtube.com"])',
	'ytd-masthead #buttons ytd-button-renderer:has(a[href*="/upload"])',
	'ytd-masthead #buttons ytd-button-renderer:has(a[href*="/create"])',
	'ytd-masthead #buttons ytd-button-renderer:has(button[aria-label*="Create" i])',
	'ytd-masthead #buttons ytd-button-renderer:has(yt-icon-button[aria-label*="Create" i])',
	'ytd-masthead #buttons ytd-button-renderer:has([aria-label*="Create" i])',
	'ytd-masthead #buttons ytd-button-renderer:has([aria-label*="Créer" i])',
	'ytd-masthead #buttons ytd-button-renderer:has([aria-label*="Crear" i])',
	'ytd-masthead #buttons ytd-button-renderer:has([aria-label*="Criar" i])',
	'ytd-masthead #buttons ytd-button-renderer:has([aria-label*="Erstellen" i])',
	'ytd-masthead #buttons ytd-button-renderer:has([aria-label*="बनाएं" i])',
	'ytd-masthead #buttons ytd-button-renderer:has([aria-label*="创建" i])',
	'ytd-masthead #buttons ytd-button-renderer:has([aria-label*="建立" i])',
	'ytd-masthead #buttons ytd-button-renderer:has(path[d*="M14 13"])',
	'ytd-masthead #buttons ytd-button-renderer:has(path[d*="M19 13"])',
	'ytm-pivot-bar-item-renderer:has([data-pivot-id="create"])',
	'ytm-pivot-bar-item-renderer:has([aria-label*="Create" i])',
	'ytm-pivot-bar-item-renderer:has(a[href*="/upload"])',
	'ytm-pivot-bar-item-renderer:has(a[href*="studio.youtube.com"])'
];

let navBarObserver = null;

function hideNotificationBell(shouldHide) {
	setRootFlag('data-lockedin-hide-notifications', shouldHide);
	toggleNavBarSelectors(NOTIFICATION_BELL_SELECTORS, shouldHide);
}

function hideCreateButton(shouldHide) {
	setRootFlag('data-lockedin-hide-create', shouldHide);
	toggleNavBarSelectors(CREATE_BUTTON_SELECTORS, shouldHide);
}

function toggleNavBarSelectors(selectors, shouldHide) {
	selectors.forEach((selector) => {
		try {
			document.querySelectorAll(selector).forEach((el) => {
				el.style.display = shouldHide ? 'none' : '';
			});
		} catch (e) {
			// Ignore unsupported pseudo-selector errors if any
		}
	});
}

function updateNavBarVisibility() {
	if (!latestSyncedSettings || latestSyncedSettings.extensionEnabled === false) {
		hideNotificationBell(false);
		hideCreateButton(false);
		return;
	}

	const isCleanNav = Boolean(latestSyncedSettings.cleanNavBar);
	const shouldHideNotifications = isCleanNav || Boolean(latestSyncedSettings.hideNotificationBell);
	const shouldHideCreate = isCleanNav || Boolean(latestSyncedSettings.hideCreateButton);

	hideNotificationBell(shouldHideNotifications);
	hideCreateButton(shouldHideCreate);
}

function observeNavBarContainers() {
	const masthead = document.querySelector('ytd-masthead, #masthead, ytm-mobile-topbar-renderer');
	if (masthead && !navBarObserver) {
		navBarObserver = new MutationObserver(() => {
			if (latestSyncedSettings && latestSyncedSettings.extensionEnabled !== false) {
				updateNavBarVisibility();
			}
		});
		navBarObserver.observe(masthead, { childList: true, subtree: true });
	}
}
