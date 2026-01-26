#!/usr/bin/env node

/**
 * Sitemap Generator
 * Generates sitemap.xml including all blog posts
 */

const fs = require('fs');
const path = require('path');

const SITE_URL = 'https://jin40photo.com';
const INDEX_JSON = path.join(__dirname, '../posts/index.json');
const SITEMAP_PATH = path.join(__dirname, '../sitemap.xml');

// Static pages
const staticPages = [
    { url: '/', priority: '1.0', changefreq: 'weekly' },
    { url: '/home', priority: '1.0', changefreq: 'weekly' },
    { url: '/gallery', priority: '0.9', changefreq: 'weekly' },
    { url: '/blog', priority: '0.8', changefreq: 'weekly' }
];

function getCurrentDate() {
    const now = new Date();
    return now.toISOString().split('T')[0]; // YYYY-MM-DD
}

function generateSitemap() {
    console.log('Generating sitemap.xml...\n');

    // Read blog posts
    let blogPosts = [];
    if (fs.existsSync(INDEX_JSON)) {
        const content = fs.readFileSync(INDEX_JSON, 'utf-8');
        blogPosts = JSON.parse(content);
    }

    // Start XML
    let xml = '<?xml version="1.0" encoding="UTF-8"?>\n';
    xml += '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n';

    // Add static pages
    staticPages.forEach(page => {
        xml += '    <url>\n';
        xml += `        <loc>${SITE_URL}${page.url}</loc>\n`;
        xml += `        <lastmod>${getCurrentDate()}</lastmod>\n`;
        xml += `        <changefreq>${page.changefreq}</changefreq>\n`;
        xml += `        <priority>${page.priority}</priority>\n`;
        xml += '    </url>\n';
    });

    // Add blog posts
    blogPosts.forEach(post => {
        // Handle localized title (prefer EN, fallback to first available key)
        let displayTitle = 'Untitled';
        if (typeof post.title === 'string') {
            displayTitle = post.title;
        } else if (typeof post.title === 'object') {
            displayTitle = post.title.en || Object.values(post.title)[0] || 'Untitled';
        }

        xml += '    <url>\n';
        xml += `        <loc>${SITE_URL}/blog/${post.slug}/</loc>\n`;
        xml += `        <lastmod>${post.date}</lastmod>\n`;
        xml += `        <changefreq>monthly</changefreq>\n`;
        xml += `        <priority>0.7</priority>\n`;
        xml += '    </url>\n';
        console.log(`  ✓ Added: ${displayTitle} (${post.slug})`);
    });

    xml += '</urlset>\n';

    // Write sitemap
    fs.writeFileSync(SITEMAP_PATH, xml);

    console.log(`\n✅ Sitemap generated with ${staticPages.length} static pages and ${blogPosts.length} blog posts`);
    console.log(`📄 File: ${SITEMAP_PATH}\n`);
}

generateSitemap();
