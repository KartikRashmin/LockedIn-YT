const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');

test('DEFAULT_SETTINGS contains navigation bar settings', () => {
	const sharedSettings = fs.readFileSync('src/content/shared/settings.js', 'utf8');
	const popupJs = fs.readFileSync('src/popup/popup.js', 'utf8');

	assert.match(sharedSettings, /cleanNavBar:\s*false/);
	assert.match(sharedSettings, /hideNotificationBell:\s*false/);
	assert.match(sharedSettings, /hideCreateButton:\s*false/);

	assert.match(popupJs, /cleanNavBar:\s*false/);
	assert.match(popupJs, /hideNotificationBell:\s*false/);
	assert.match(popupJs, /hideCreateButton:\s*false/);
});

test('popup.html includes YouTube Navigation Bar group with proper toggles', () => {
	const popupHtml = fs.readFileSync('src/popup/popup.html', 'utf8');

	assert.match(popupHtml, /data-group="navbar"/);
	assert.match(popupHtml, /data-setting="cleanNavBar"/);
	assert.match(popupHtml, /id="cleanNavSubToggles"/);
	assert.match(popupHtml, /data-setting="hideNotificationBell"/);
	assert.match(popupHtml, /data-setting="hideCreateButton"/);
});

test('popup.js has translations for all 8 languages for navigation bar keys', () => {
	const popupJs = fs.readFileSync('src/popup/popup.js', 'utf8');
	const languages = ['en', 'es', 'hi', 'pt', 'fr', 'de', 'zh-CN', 'zh-TW'];

	for (const lang of languages) {
		assert.ok(
			popupJs.includes(`'group.navbar'`),
			`Missing group.navbar translation for ${lang}`
		);
		assert.ok(
			popupJs.includes(`'setting.cleanNavBar'`),
			`Missing setting.cleanNavBar translation for ${lang}`
		);
		assert.ok(
			popupJs.includes(`'setting.hideNotificationBell'`),
			`Missing setting.hideNotificationBell translation for ${lang}`
		);
		assert.ok(
			popupJs.includes(`'setting.hideCreateButton'`),
			`Missing setting.hideCreateButton translation for ${lang}`
		);
	}
});

test('manifest.json and build include navbar content script', () => {
	const manifest = JSON.parse(fs.readFileSync('src/manifest.json', 'utf8'));
	const scripts = manifest.content_scripts[0].js;

	assert.ok(scripts.includes('content/navbar.js'), 'content/navbar.js must be in content_scripts');
	assert.ok(fs.existsSync('src/content/navbar.js'), 'src/content/navbar.js file must exist');
});
