#!/usr/bin/env node

/**
 * LockedIn Release Notes Generator
 * Extracts and formats release notes matching LockedIn's release style:
 * - What is new (extracted from CHANGELOG.md for the current version)
 * - Categorized sections (### Added, ### Fixed, ### Changed, etc.)
 * - Credits (if contributors are mentioned)
 * - Downloads list
 * - PR Reference ("Implemented in #XX")
 * - Full changelog comparison link
 * - Optional Gemini AI enhancement when GEMINI_API_KEY is available.
 */

const fs = require('fs');
const { execSync } = require('child_process');

function getVersion() {
	if (process.argv[2]) return process.argv[2].replace(/^v/, '');
	const manifest = JSON.parse(fs.readFileSync('src/manifest.json', 'utf8'));
	return manifest.version;
}

function getPreviousTag(currentVersion) {
	try {
		const tags = execSync('git tag -l --sort=v:refname "v*"', { encoding: 'utf8' })
			.trim()
			.split('\n')
			.filter(Boolean);
		const targetTag = `v${currentVersion}`;
		const idx = tags.indexOf(targetTag);
		if (idx > 0) return tags[idx - 1];
		if (idx === -1 && tags.length > 0) return tags[tags.length - 1];
		return null;
	} catch (e) {
		return null;
	}
}

function extractChangelogSection(version) {
	if (!fs.existsSync('CHANGELOG.md')) return '';
	const text = fs.readFileSync('CHANGELOG.md', 'utf8');
	const escaped = version.replace(/\./g, '\\.');
	const regex = new RegExp(`^## \\[${escaped}\\][\\s\\S]*?(?=(^## \\[|\\Z))`, 'm');
	const match = text.match(regex);
	if (!match) return '';

	// Remove the ## [x.y.z] header line
	return match[0].replace(/^## \[[^\]]+\].*?\n+/, '').trim();
}

function getPRReference(repo) {
	try {
		const log = execSync('git log -1 --pretty=%B', { encoding: 'utf8' }).trim();
		const match = log.match(/Merge pull request #(\d+)/i) || log.match(/\(#(\d+)\)/);
		if (match) {
			const prNum = match[1];
			return `Implemented in [#${prNum}](https://github.com/${repo}/pull/${prNum}).`;
		}
	} catch (e) {
		// Ignore if unavailable
	}
	return null;
}

async function enhanceWithGemini(changelogBody, version, prevTag) {
	const apiKey = process.env.GEMINI_API_KEY;
	if (!apiKey) return null;

	const prompt = `You are formatting a GitHub Release for LockedIn-YT browser extension v${version}.
Here is the raw changelog text for this version:
${changelogBody}

Format the release notes strictly following this layout:
## What is new

[Categorized sections such as ### Added, ### Fixed, ### Changed with markdown bullet items starting with "- "]

### Credits (only if contributors are mentioned or thanks are due)
[Credit notes with markdown bullet items starting with "- "]

Do not include downloads, PR links, or full changelog links in your response, as they will be added automatically. Keep the tone friendly and clean.`;

	try {
		const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`;
		const res = await fetch(url, {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({
				contents: [{ parts: [{ text: prompt }] }],
				generationConfig: { maxOutputTokens: 800 }
			})
		});
		if (!res.ok) return null;
		const data = await res.json();
		return data?.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || null;
	} catch (e) {
		return null;
	}
}

async function main() {
	const version = getVersion();
	const prevTag = getPreviousTag(version);
	const repo = process.env.GITHUB_REPOSITORY || 'KartikRashmin/LockedIn-YT';

	console.log(`Generating release notes for v${version} (prev: ${prevTag || 'none'})...`);

	let changelogBody = extractChangelogSection(version);

	// Try AI enhancement if GEMINI_API_KEY is available
	const aiNotes = await enhanceWithGemini(changelogBody, version, prevTag);

	let notes = '';

	if (aiNotes) {
		notes = aiNotes.trim() + '\n\n';
	} else if (changelogBody) {
		notes = `## What is new\n\n${changelogBody}\n\n`;
	} else {
		notes = `## What is new in v${version}\n\n- Maintenance and feature update.\n\n`;
	}

	// Downloads section matching the exact release format
	notes += `## Downloads\n\n`;
	notes += `- Firefox: \`lockedin-v${version}-firefox.zip\`\n`;
	notes += `- Chrome / Edge / Brave: \`lockedin-v${version}-chromium.zip\`\n`;
	notes += `- Opera: \`lockedin-v${version}-opera.zip\`\n`;
	notes += `- Source code, including regression tests: \`lockedin-v${version}-source.zip\`\n`;
	notes += `- Package checksums: \`SHA256SUMS.txt\`\n\n`;

	const prRef = getPRReference(repo);
	if (prRef) {
		notes += `${prRef}\n\n`;
	}

	if (prevTag) {
		notes += `[Full changelog](https://github.com/${repo}/compare/${prevTag}...v${version})\n`;
	}

	console.log('--- Generated Release Notes ---');
	console.log(notes);
	console.log('-------------------------------');

	fs.writeFileSync('RELEASE_NOTES.md', notes);
	console.log('Saved to RELEASE_NOTES.md');
}

main().catch(err => {
	console.error('Failed to generate release notes:', err);
	process.exit(1);
});
