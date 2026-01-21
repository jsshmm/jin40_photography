#!/usr/bin/env node

/**
 * Blog Build Script
 * Scans posts/ folder for .md files and generates index.json
 *
 * Usage: node scripts/build-blog.js
 * Or: npm run build-blog
 */

const fs = require('fs');
const path = require('path');

const POSTS_DIR = path.join(__dirname, '..', 'posts');
const INDEX_FILE = path.join(POSTS_DIR, 'index.json');

/**
 * Parse frontmatter from markdown content
 */
function parseFrontmatter(content) {
    const frontmatterRegex = /^---\n([\s\S]*?)\n---/;
    const match = content.match(frontmatterRegex);

    if (!match) {
        return null;
    }

    const frontmatter = match[1];
    const metadata = {};

    frontmatter.split('\n').forEach(line => {
        const colonIndex = line.indexOf(':');
        if (colonIndex > -1) {
            const key = line.slice(0, colonIndex).trim();
            let value = line.slice(colonIndex + 1).trim();
            // Remove quotes if present
            if ((value.startsWith('"') && value.endsWith('"')) ||
                (value.startsWith("'") && value.endsWith("'"))) {
                value = value.slice(1, -1);
            }
            metadata[key] = value;
        }
    });

    return metadata;
}

/**
 * Get slug from filename
 * Example: 2024-03-15-golden-hour.md -> 2024-03-15-golden-hour
 */
function getSlugFromFilename(filename) {
    return filename.replace(/\.md$/, '');
}

/**
 * Main build function
 */
/**
 * Main build function
 */
function buildBlogIndex() {
    console.log('Building blog index...\n');

    // Check if posts directory exists
    if (!fs.existsSync(POSTS_DIR)) {
        console.error('Error: posts/ directory not found');
        process.exit(1);
    }

    // Get all directories (excluding those starting with _)
    const items = fs.readdirSync(POSTS_DIR, { withFileTypes: true });
    const directories = items
        .filter(item => item.isDirectory() && !item.name.startsWith('_'))
        .map(item => item.name);

    console.log(`Found ${directories.length} post directory(s)\n`);

    const posts = [];

    for (const slug of directories) {
        const postDir = path.join(POSTS_DIR, slug);
        const supportedLangs = ['en', 'ko', 'jp'];

        let baseMetadata = null;
        let titleObj = {};
        let excerptObj = {};

        // Find available languages
        const availableLangs = supportedLangs.filter(lang =>
            fs.existsSync(path.join(postDir, `${lang}.md`))
        );

        if (availableLangs.length === 0) {
            console.warn(`Warning: No markdown files found in ${slug}, skipping...`);
            continue;
        }

        // Process each language file
        for (const lang of availableLangs) {
            const content = fs.readFileSync(path.join(postDir, `${lang}.md`), 'utf-8');
            const metadata = parseFrontmatter(content);

            if (!metadata) continue;

            // Use first available metadata as base (usually 'en' if available)
            if (!baseMetadata) {
                baseMetadata = metadata;
            }

            // Aggregate localized strings
            titleObj[lang] = metadata.title || '';
            excerptObj[lang] = metadata.excerpt || '';

            // If base metadata was set from a non-EN file but now we have EN, 
            // maybe update base metadata to EN for consistency? 
            // For now, first found is fine.
        }

        if (!baseMetadata) {
            console.warn(`Warning: Failed to parse metadata for ${slug}, skipping...`);
            continue;
        }

        const post = {
            slug,
            title: titleObj,
            excerpt: excerptObj,
            date: baseMetadata.date || '',
            category: baseMetadata.category || 'General',
            thumbnail: baseMetadata.thumbnail || ''
        };

        posts.push(post);
        console.log(`  ✓ ${slug}`);
        console.log(`    Languages: ${availableLangs.join(', ')}`);
        console.log(`    Date: ${post.date}\n`);
    }

    // Sort by date (newest first)
    posts.sort((a, b) => new Date(b.date) - new Date(a.date));

    // Write index.json
    fs.writeFileSync(INDEX_FILE, JSON.stringify(posts, null, 2) + '\n');

    console.log(`\nSuccess! Generated index.json with ${posts.length} post(s)`);
}

// Run
buildBlogIndex();
