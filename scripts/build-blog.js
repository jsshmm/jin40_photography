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
const BLOG_DIR = path.join(__dirname, '..', 'blog');
const POST_TEMPLATE = path.join(__dirname, '..', 'post.html');

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

    return posts;
}

/**
 * Generate individual blog post HTML files
 * Creates blog/{slug}/index.html for each post
 */
function generatePostPages(posts) {
    console.log('\nGenerating post pages...\n');

    // Read the post.html template
    if (!fs.existsSync(POST_TEMPLATE)) {
        console.error('Error: post.html template not found');
        process.exit(1);
    }

    const template = fs.readFileSync(POST_TEMPLATE, 'utf-8');

    // Create blog directory if it doesn't exist
    if (!fs.existsSync(BLOG_DIR)) {
        fs.mkdirSync(BLOG_DIR, { recursive: true });
    }

    // Clean up old blog post directories (keep only current posts)
    const existingDirs = fs.readdirSync(BLOG_DIR, { withFileTypes: true })
        .filter(item => item.isDirectory())
        .map(item => item.name);

    const currentSlugs = posts.map(p => p.slug);

    for (const dir of existingDirs) {
        if (!currentSlugs.includes(dir)) {
            const dirPath = path.join(BLOG_DIR, dir);
            fs.rmSync(dirPath, { recursive: true });
            console.log(`  🗑️  Removed old: ${dir}`);
        }
    }

    // Generate HTML for each post
    for (const post of posts) {
        const postDir = path.join(BLOG_DIR, post.slug);
        const indexFile = path.join(postDir, 'index.html');

        // Create post directory
        if (!fs.existsSync(postDir)) {
            fs.mkdirSync(postDir, { recursive: true });
        }

        // Modify template: fix relative paths for nested directory
        let html = template;

        // Fix CSS path
        html = html.replace('href="css/style.css"', 'href="../../css/style.css"');

        // Fix script paths
        html = html.replace('src="js/main.js"', 'src="../../js/main.js"');
        html = html.replace('src="js/comments.js"', 'src="../../js/comments.js"');
        html = html.replace('src="js/blog.js"', 'src="../../js/blog.js"');

        // Fix navigation links (use replaceAll for multiple occurrences)
        html = html.replaceAll('href="/"', 'href="../../"');
        html = html.replaceAll('href="gallery"', 'href="../../gallery"');
        html = html.replaceAll('href="blog"', 'href="../../blog"');
        html = html.replaceAll('href="guestbook"', 'href="../../guestbook"');

        // Write the file
        fs.writeFileSync(indexFile, html);
        console.log(`  ✓ ${post.slug}/index.html`);
    }

    console.log(`\n✅ Generated ${posts.length} post page(s) in blog/`);
}

// Run
const posts = buildBlogIndex();
generatePostPages(posts);
