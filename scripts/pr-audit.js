#!/usr/bin/env node

/**
 * LockedIn PR Audit & Quality Reviewer
 * Runs during pull request CI to audit security, permissions, changelog hygiene,
 * and optionally generate an AI summary with Gemini API if configured.
 */

const { execSync } = require('child_process');
const fs = require('fs');

function getDiff(baseRef = 'origin/main') {
	try {
		return execSync(`git diff ${baseRef}...HEAD`, { encoding: 'utf8', maxBuffer: 10 * 1024 * 1024 });
	} catch (e) {
		try {
			return execSync(`git diff HEAD~1...HEAD`, { encoding: 'utf8', maxBuffer: 10 * 1024 * 1024 });
		} catch (err) {
			console.warn('Unable to get git diff:', err.message);
			return '';
		}
	}
}

function getChangedFiles(baseRef = 'origin/main') {
	try {
		const out = execSync(`git diff ${baseRef}...HEAD --name-only`, { encoding: 'utf8' });
		return out.trim().split('\n').filter(Boolean);
	} catch (e) {
		try {
			const out = execSync(`git diff HEAD~1...HEAD --name-only`, { encoding: 'utf8' });
			return out.trim().split('\n').filter(Boolean);
		} catch (err) {
			return [];
		}
	}
}

async function runGeminiReview(diff, changedFiles) {
	const apiKey = process.env.GEMINI_API_KEY;
	if (!apiKey) return null;

	const prompt = `You are an expert browser extension security and code reviewer reviewing a pull request for "LockedIn-YT", a Manifest V3 browser extension built with plain JavaScript, HTML, and CSS.

Changed files:
${changedFiles.join('\n')}

Git Diff:
\`\`\`diff
${diff.slice(0, 15000)}
\`\`\`

Provide a concise, helpful review with:
1. A 1-2 sentence summary of the change.
2. Architecture & Code Quality assessment.
3. Any potential edge cases or YouTube DOM compatibility risks.
Keep it constructive and bulleted.`;

	try {
		const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`;
		const res = await fetch(url, {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({
				contents: [{ parts: [{ text: prompt }] }],
				generationConfig: { maxOutputTokens: 600 }
			})
		});

		if (!res.ok) {
			console.warn('Gemini API call failed with status:', res.status);
			return null;
		}

		const data = await res.json();
		return data?.candidates?.[0]?.content?.parts?.[0]?.text || null;
	} catch (err) {
		console.warn('Error querying Gemini API:', err.message);
		return null;
	}
}

async function main() {
	const baseBranch = process.env.GITHUB_BASE_REF ? `origin/${process.env.GITHUB_BASE_REF}` : 'origin/main';
	const changedFiles = getChangedFiles(baseBranch);
	const diff = getDiff(baseBranch);

	const findings = [];
	const successes = [];

	// 1. Changelog Check
	const touchesUserCode = changedFiles.some(f => f.startsWith('src/content/') || f.startsWith('src/popup/'));
	const touchedChangelog = changedFiles.includes('CHANGELOG.md');

	if (touchesUserCode && !touchedChangelog) {
		findings.push('⚠️ **Changelog reminder**: This PR modifies user-facing extension code, but `CHANGELOG.md` was not updated. Please consider documenting your changes.');
	} else if (touchesUserCode && touchedChangelog) {
		successes.push('✓ `CHANGELOG.md` updated with release notes.');
	}

	// 2. Manifest & Permissions Audit
	if (changedFiles.includes('src/manifest.json')) {
		const addedPermissions = [];
		const addedHosts = [];
		const diffLines = diff.split('\n');

		let inPermissions = false;
		for (const line of diffLines) {
			if (line.includes('"permissions"')) inPermissions = true;
			if (line.includes('"host_permissions"') || line.includes('"content_scripts"')) inPermissions = false;
			if (inPermissions && line.startsWith('+') && !line.startsWith('+++')) {
				const match = line.match(/"([^"]+)"/);
				if (match && match[1] !== 'permissions') addedPermissions.push(match[1]);
			}
			if (line.includes('"host_permissions"') && line.startsWith('+') && !line.startsWith('+++')) {
				const match = line.match(/"([^"]+)"/);
				if (match && match[1] !== 'host_permissions') addedHosts.push(match[1]);
			}
		}

		if (addedPermissions.length > 0) {
			findings.push(`ℹ️ **New Permissions requested**: \`${addedPermissions.join('`, `')}\`. Please ensure these are strictly necessary.`);
		}
		if (addedHosts.length > 0) {
			findings.push(`ℹ️ **New Host Permissions requested**: \`${addedHosts.join('`, `')}\`.`);
		}
		if (addedPermissions.length === 0 && addedHosts.length === 0) {
			successes.push('✓ Manifest permissions remain minimal and unchanged.');
		}
	}

	// 3. Code Security & Best Practices Scan
	const dangerousPatterns = [
		{ regex: /innerHTML\s*=/, message: 'Usage of `innerHTML` detected. Prefer `textContent` or `document.createElement()` to prevent XSS.' },
		{ regex: /\beval\s*\(/, message: 'Usage of `eval()` detected. This violates Manifest V3 security policy.' },
		{ regex: /document\.write\s*\(/, message: 'Usage of `document.write()` detected. This is forbidden in modern extensions.' }
	];

	const addedLines = diff.split('\n').filter(l => l.startsWith('+') && !l.startsWith('+++'));
	for (const pattern of dangerousPatterns) {
		const match = addedLines.find(l => pattern.regex.test(l));
		if (match) {
			findings.push(`⚠️ **Code Safety**: ${pattern.message}\n> \`${match.trim().slice(0, 100)}\``);
		}
	}

	if (findings.filter(f => f.includes('Code Safety')).length === 0) {
		successes.push('✓ No unsafe DOM insertion or forbidden eval patterns detected.');
	}

	// 4. Optional AI Review via Gemini
	const aiReview = await runGeminiReview(diff, changedFiles);

	// Output Markdown Report
	let report = '### 🔍 LockedIn PR Quality & Security Report\n\n';

	if (successes.length > 0) {
		report += successes.map(s => `- ${s}`).join('\n') + '\n\n';
	}

	if (findings.length > 0) {
		report += '#### Observations\n' + findings.map(f => `- ${f}`).join('\n') + '\n\n';
	}

	if (aiReview) {
		report += `#### 🤖 AI Review Analysis (Gemini)\n${aiReview}\n\n`;
	}

	report += '> Automated by LockedIn CI Pipeline.';

	console.log(report);

	// Write to report file for GitHub Actions step to consume
	fs.writeFileSync('pr-audit-report.md', report);
}

main().catch(err => {
	console.error('Audit failed:', err);
	process.exit(1);
});
