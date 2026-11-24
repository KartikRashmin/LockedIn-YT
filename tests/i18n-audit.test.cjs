const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');

test('all data-i18n-key attributes in popup.html are translated across all 8 languages', () => {
	const html = fs.readFileSync('src/popup/popup.html', 'utf8');
	const js = fs.readFileSync('src/popup/popup.js', 'utf8').replace(/\r\n/g, '\n');

	const keysInHtml = [...new Set([...html.matchAll(/data-i18n-key="([^"]+)"/g)].map(m => m[1]))];
	assert.ok(keysInHtml.length > 0, 'Must find i18n keys in popup.html');

	const match = js.match(/const I18N_STRINGS = ({[\s\S]*?\n};\n)/);
	assert.ok(match, 'Must locate I18N_STRINGS dictionary in popup.js');

	const dict = eval('(' + match[1].slice(0, -2) + ')');
	const expectedLanguages = ['en', 'es', 'hi', 'pt', 'fr', 'de', 'zh-CN', 'zh-TW'];

	for (const lang of expectedLanguages) {
		assert.ok(dict[lang], `Language '${lang}' must exist in I18N_STRINGS`);
		const missing = keysInHtml.filter(k => !(k in dict[lang]));
		assert.deepEqual(
			missing,
			[],
			`Language '${lang}' is missing translations for keys: ${missing.join(', ')}`
		);
	}
});

test('manifest.json has required metadata and permissions schema', () => {
	const manifest = JSON.parse(fs.readFileSync('src/manifest.json', 'utf8'));

	assert.equal(manifest.manifest_version, 3, 'Must be Manifest V3');
	assert.ok(manifest.name, 'Must have name');
	assert.ok(manifest.version, 'Must have version');
	assert.ok(manifest.description, 'Must have description');
	assert.ok(manifest.action && manifest.action.default_popup, 'Must specify default_popup');
	assert.ok(Array.isArray(manifest.content_scripts), 'Must specify content_scripts');

	// Verify all content script files exist
	for (const entry of manifest.content_scripts) {
		for (const file of entry.js || []) {
			assert.ok(fs.existsSync(`src/${file}`), `Content script src/${file} must exist`);
		}
	}
});
