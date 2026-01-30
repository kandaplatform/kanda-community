const fs = require('fs');
const path = require('path');
const matter = require('gray-matter');
const { marked } = require('marked');

const NOTES_DIR = path.join(__dirname, '../RELEASE_NOTES');
const DIST_DIR = path.join(__dirname, '../dist-api');

// Create dist folder
if (!fs.existsSync(DIST_DIR)) fs.mkdirSync(DIST_DIR);

const releases = [];

// Recursive function to find all .md files
const getFiles = (dir) => {
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    for (const entry of entries) {
        const fullPath = path.join(dir, entry.name);
        if (entry.isDirectory()) {
            getFiles(fullPath);
        } else if (entry.name.endsWith('.md')) {
            const fileContents = fs.readFileSync(fullPath, 'utf8');
            const { data, content } = matter(fileContents);

            const releaseEntry = {
                version: entry.name.replace('.md', ''),
                title: data.title || `Release ${entry.name.replace('.md', '')}`,
                date: data.date || new Date().toISOString().split('T')[0],
                content: marked.parse(content), // Pre-render HTML for the client
                raw: content
            };

            releases.push(releaseEntry);
            // Save individual JSON for deep-linking: /api/v1.2.3.json
            fs.writeFileSync(path.join(DIST_DIR, `${releaseEntry.version}.json`), JSON.stringify(releaseEntry));
        }
    }
};

getFiles(NOTES_DIR);

// Sort by SemVer (Descending)
releases.sort((a, b) => b.version.localeCompare(a.version, undefined, { numeric: true, sensitivity: 'base' }));

// Save master index: /api/releases.json
fs.writeFileSync(path.join(DIST_DIR, 'releases.json'), JSON.stringify(releases));
console.log('✅ API Generated successfully.');
