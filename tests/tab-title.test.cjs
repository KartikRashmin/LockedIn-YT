const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');

test('DEFAULT_SETTINGS contains the browser tab title setting', () => {
	const sharedSettings = fs.readFileSync('src/content/shared/settings.js', 'utf8');
	const popupJs = fs.readFileSync('src/popup/popup.js', 'utf8');

	assert.match(sharedSettings, /hideTabNotificationCount:\s*false/);
	assert.match(popupJs, /hideTabNotificationCount:\s*false/);
});

test('popup.html includes Miscellaneous group with the notification count toggle', () => {
	const popupHtml = fs.readFileSync('src/popup/popup.html', 'utf8');

	assert.match(popupHtml, /data-group="misc"/);
	assert.match(popupHtml, /data-setting="hideTabNotificationCount"/);
});

test('popup.js has Miscellaneous translations for all 8 languages', () => {
	const popupJs = fs.readFileSync('src/popup/popup.js', 'utf8');
	const languages = ['en', 'es', 'hi', 'pt', 'fr', 'de', 'zh-CN', 'zh-TW'];

	for (const lang of languages) {
		assert.ok(popupJs.includes(`'group.misc'`), `Missing group.misc translation for ${lang}`);
		assert.ok(
			popupJs.includes(`'setting.hideTabNotificationCount'`),
			`Missing setting.hideTabNotificationCount translation for ${lang}`
		);
	}
});

test('manifest.json and build include the tab title content scripts', () => {
	const manifest = JSON.parse(fs.readFileSync('src/manifest.json', 'utf8'));
	const scripts = manifest.content_scripts[0].js;
	const resources = manifest.web_accessible_resources.flatMap((entry) => entry.resources || []);

	assert.ok(scripts.includes('content/tab-title.js'), 'content/tab-title.js must be in content_scripts');
	assert.ok(fs.existsSync('src/content/tab-title.js'), 'src/content/tab-title.js file must exist');
	assert.ok(
		resources.includes('content/tab-title-inject.js'),
		'content/tab-title-inject.js must be web accessible'
	);
	assert.ok(fs.existsSync('src/content/tab-title-inject.js'), 'src/content/tab-title-inject.js file must exist');
});

test('main-world script strips the title synchronously through the title setter', () => {
	const injectJs = fs.readFileSync('src/content/tab-title-inject.js', 'utf8');

	assert.match(injectJs, /Object\.defineProperty\(Document\.prototype, 'title'/);
	assert.match(injectJs, /set: function \(value\)/);
	assert.match(injectJs, /data-lockedin-tab-title-ready/);
	assert.match(injectJs, /lastCapturedPrefix/);
	assert.match(injectJs, /restoreTitle/);
});

test('tab title counter pattern removes localized notification prefixes', () => {
	const sources = [
		fs.readFileSync('src/content/tab-title.js', 'utf8'),
		fs.readFileSync('src/content/tab-title-inject.js', 'utf8')
	];
	const cases = [
		['(3) YouTube', 'YouTube'],
		['(3) VIDEO TITLE - YouTube', 'VIDEO TITLE - YouTube'],
		['(3) Subscriptions - YouTube', 'Subscriptions - YouTube'],
		['(99+) YouTube', 'YouTube'],
		['（12）YouTube', 'YouTube'],
		['【7】 VIDEO TITLE - YouTube', 'VIDEO TITLE - YouTube'],
		['(١٢) YouTube', 'YouTube'],
		['(१२) YouTube', 'YouTube'],
		['(1,234) YouTube', 'YouTube'],
		['(3) (1) Actual Video Title (2) - YouTube', '(1) Actual Video Title (2) - YouTube'],
		['YouTube', 'YouTube'],
		['VIDEO TITLE (3) - YouTube', 'VIDEO TITLE (3) - YouTube']
	];

	for (const source of sources) {
		const match = source.match(/(?:const TAB_TITLE_NOTIFICATION_PREFIX|var PREFIX) = (\/[^\n]+\/u);/);
		assert.ok(match, 'Must locate the tab title counter pattern');

		const pattern = eval(match[1]);
		for (const [title, expected] of cases) {
			assert.equal(title.replace(pattern, ''), expected, `Unexpected result for "${title}"`);
		}
	}
});
