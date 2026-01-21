// ===== Blog System =====
// Handles markdown-based blog functionality

// ===== Blog System =====
// Handles markdown-based blog functionality

const BlogSystem = {
    postsIndexUrl: './posts/index.json',
    postsDir: './posts/',
    currentLang: localStorage.getItem('selectedLang') || 'en',

    // Format date based on language
    formatDate(dateStr) {
        const date = new Date(dateStr);
        const options = { year: 'numeric', month: 'long', day: 'numeric' };

        let locale = 'en-US';
        if (this.currentLang === 'ko') locale = 'ko-KR';
        if (this.currentLang === 'jp') locale = 'ja-JP';

        return date.toLocaleDateString(locale, options);
    },

    // Parse frontmatter from markdown
    parseFrontmatter(markdown) {
        const frontmatterRegex = /^---\n([\s\S]*?)\n---\n([\s\S]*)$/;
        const match = markdown.match(frontmatterRegex);

        if (!match) {
            return { metadata: {}, content: markdown };
        }

        const frontmatter = match[1];
        const content = match[2];
        const metadata = {};

        frontmatter.split('\n').forEach(line => {
            const colonIndex = line.indexOf(':');
            if (colonIndex > -1) {
                const key = line.slice(0, colonIndex).trim();
                const value = line.slice(colonIndex + 1).trim();
                metadata[key] = value;
            }
        });

        return { metadata, content };
    },

    // Fetch posts index
    async fetchPostsIndex() {
        try {
            const response = await fetch(this.postsIndexUrl);
            if (!response.ok) throw new Error(`Failed to fetch posts index: ${response.status}`);
            return await response.json();
        } catch (error) {
            console.error('Error fetching posts index:', error);
            return [];
        }
    },

    // Fetch single post markdown
    async fetchPost(slug) {
        try {
            // Try fetching localized version first (e.g., posts/slug/ko.md)
            let filename = `${slug}/${this.currentLang}.md`;

            let response = await fetch(`${this.postsDir}${filename}`);

            // Fallback to English (or first available) if localized not found
            // This logic relies on user ensuring at least one language exists or explicit fallbacks.
            // A robust fallback could be trying 'en.md' explicitly if currentLang fails.
            if (!response.ok && this.currentLang !== 'en') {
                response = await fetch(`${this.postsDir}${slug}/en.md`);
            }

            // If still not found, throw error
            if (!response.ok) throw new Error('Failed to fetch post');
            return await response.text();
        } catch (error) {
            console.error('Error fetching post:', error);
            return null;
        }
    },

    // Get localized string from post object
    getLocalized(obj, key) {
        if (!obj[key]) return '';
        if (typeof obj[key] === 'string') return obj[key];
        return obj[key][this.currentLang] || obj[key]['en'] || '';
    },

    // Render blog list (for blog.html)
    async renderBlogList() {
        const blogGrid = document.getElementById('blog-grid');
        const blogLoading = document.getElementById('blog-loading');
        const blogEmpty = document.getElementById('blog-empty');

        if (!blogGrid) return;

        // Reset grid
        blogGrid.innerHTML = '';
        if (blogLoading) blogLoading.style.display = 'block';
        if (blogEmpty) blogEmpty.style.display = 'none';

        try {
            const posts = await this.fetchPostsIndex();

            // Sort by date (newest first)
            posts.sort((a, b) => new Date(b.date) - new Date(a.date));

            if (blogLoading) blogLoading.style.display = 'none';

            if (posts.length === 0) {
                if (blogEmpty) blogEmpty.style.display = 'block';
                return;
            }

            const readMoreText = 'Read more &rarr;';

            blogGrid.innerHTML = posts.map(post => {
                const title = this.getLocalized(post, 'title');
                const excerpt = this.getLocalized(post, 'excerpt');

                return `
                <article class="blog-card">
                    <div class="blog-image">
                        <a href="post.html?slug=${post.slug}">
                            <img src="${post.thumbnail}" alt="${title}"
                                 onerror="this.src='https://picsum.photos/600/400?random=${Math.random()}'">
                        </a>
                        <span class="blog-category">${post.category}</span>
                    </div>
                    <div class="blog-content">
                        <div class="blog-meta">
                            <span class="blog-date">${this.formatDate(post.date)}</span>
                        </div>
                        <h3><a href="post.html?slug=${post.slug}">${title}</a></h3>
                        <p>${excerpt}</p>
                        <a href="post.html?slug=${post.slug}" class="read-more">${readMoreText}</a>
                    </div>
                </article>
            `}).join('');

            // Add fade-in animation
            blogGrid.querySelectorAll('.blog-card').forEach((card, index) => {
                card.style.opacity = '0';
                card.style.animation = `fadeIn 0.5s ease ${index * 0.1}s forwards`;
            });

        } catch (error) {
            if (blogLoading) blogLoading.style.display = 'none';
            if (blogEmpty) {
                blogEmpty.innerHTML = '<p>Error loading posts.</p>';
                blogEmpty.style.display = 'block';
            }
        }
    },

    // Update meta tags for SEO and social sharing
    updateMetaTags(metadata, slug) {
        const baseUrl = 'https://jin40photo.com';
        const postUrl = `${baseUrl}/post.html?slug=${slug}`;
        const thumbnailUrl = metadata.thumbnail ? `${baseUrl}/${metadata.thumbnail}` : `${baseUrl}/images/hero/hero-photo.webp`;

        // Update or create meta tags
        const metaTags = {
            // Basic meta
            'description': metadata.excerpt || metadata.title,
            'keywords': `${metadata.title}, photography, ${metadata.category}`,

            // Open Graph
            'og:title': metadata.title,
            'og:description': metadata.excerpt || metadata.title,
            'og:image': thumbnailUrl,
            'og:url': postUrl,
            'og:type': 'article',

            // Twitter Card
            'twitter:card': 'summary_large_image',
            'twitter:title': metadata.title,
            'twitter:description': metadata.excerpt || metadata.title,
            'twitter:image': thumbnailUrl,
        };

        // Update existing or create new meta tags
        Object.entries(metaTags).forEach(([name, content]) => {
            const isProperty = name.startsWith('og:') || name.startsWith('article:');
            const attribute = isProperty ? 'property' : 'name';

            let meta = document.querySelector(`meta[${attribute}="${name}"]`);
            if (!meta) {
                meta = document.createElement('meta');
                meta.setAttribute(attribute, name);
                document.head.appendChild(meta);
            }
            meta.setAttribute('content', content);
        });
    },

    // Render single post (for post.html)
    async renderPost() {
        // ... (Similar to original but force re-fetch if language changes)
        // Accessing DOM elements locally to ensure fresh reference
        const postTitle = document.getElementById('post-title');
        const postCategory = document.getElementById('post-category');
        const postDate = document.getElementById('post-date');
        const postThumbnail = document.getElementById('post-thumbnail');
        const postBody = document.getElementById('post-body');
        const postLoading = document.getElementById('post-loading');
        const postError = document.getElementById('post-error');
        const relatedGrid = document.getElementById('related-grid');

        if (!postBody) return;

        const urlParams = new URLSearchParams(window.location.search);
        const slug = urlParams.get('slug');

        if (!slug) {
            if (postLoading) postLoading.style.display = 'none';
            if (postError) postError.style.display = 'block';
            return;
        }

        try {
            const markdown = await this.fetchPost(slug);

            if (!markdown) {
                if (postLoading) postLoading.style.display = 'none';
                if (postError) postError.style.display = 'block';
                return;
            }

            const { metadata, content } = this.parseFrontmatter(markdown);

            if (postTitle) postTitle.textContent = metadata.title || 'Untitled';
            if (postCategory) postCategory.textContent = metadata.category || 'General';
            if (postDate) postDate.textContent = metadata.date ? this.formatDate(metadata.date) : '';

            if (postThumbnail && metadata.thumbnail) {
                postThumbnail.src = metadata.thumbnail;
                postThumbnail.alt = metadata.title;
            }

            document.title = `${metadata.title} - jin40_photography`;
            this.updateMetaTags(metadata, slug);

            if (typeof marked !== 'undefined') {
                marked.setOptions({ breaks: true, gfm: true });
                postBody.innerHTML = marked.parse(content);
            } else {
                postBody.innerHTML = this.simpleMarkdownRender(content);
            }

            if (postLoading) postLoading.style.display = 'none';

            // IMPORTANT: Render related posts with correct language
            const relatedContainer = document.getElementById('related-posts');
            if (relatedContainer && relatedGrid) {
                this.renderRelatedPosts(slug, relatedContainer, relatedGrid);
            }

        } catch (error) {
            console.error('Error rendering post:', error);
            if (postLoading) postLoading.style.display = 'none';
            if (postError) postError.style.display = 'block';
        }
    },

    // Render related posts
    async renderRelatedPosts(currentSlug, container, grid) {
        if (!container || !grid) return;

        try {
            const posts = await this.fetchPostsIndex();
            const otherPosts = posts
                .filter(post => post.slug !== currentSlug)
                .sort((a, b) => new Date(b.date) - new Date(a.date))
                .slice(0, 3);

            if (otherPosts.length === 0) return;

            grid.innerHTML = otherPosts.map(post => {
                const title = this.getLocalized(post, 'title');
                return `
                <a href="post.html?slug=${post.slug}" class="related-card">
                    <img src="${post.thumbnail}" alt="${title}"
                         onerror="this.src='https://picsum.photos/300/200?random=${Math.random()}'">
                    <h4>${title}</h4>
                </a>
            `}).join('');

            container.style.display = 'block';
        } catch (error) {
            console.error('Error rendering related posts:', error);
        }
    },

    // Simple markdown reference (same as before)
    simpleMarkdownRender(markdown) {
        return markdown
            .replace(/^# (.*$)/gm, '<h1>$1</h1>')
            .replace(/^## (.*$)/gm, '<h2>$1</h2>')
            .replace(/^### (.*$)/gm, '<h3>$1</h3>')
            .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
            .replace(/\*(.*?)\*/g, '<em>$1</em>')
            .replace(/!\[(.*?)\]\((.*?)\)/g, '<img src="$2" alt="$1">')
            .replace(/\[(.*?)\]\((.*?)\)/g, '<a href="$2">$1</a>')
            .replace(/\n/g, '<br>');
    },

    // Refresh content on language change
    onLanguageChange(lang) {
        this.currentLang = lang;
        const currentPage = window.location.pathname.split('/').pop();

        if (currentPage === 'blog.html' || currentPage === 'blog' || currentPage === '') {
            this.renderBlogList();
        } else if (currentPage === 'post.html' || currentPage === 'post') {
            this.renderPost();
        }
    },

    // Initialize based on current page
    init() {
        const currentPage = window.location.pathname.split('/').pop();

        // Listen for global language change event
        window.addEventListener('languageChanged', (e) => {
            this.onLanguageChange(e.detail.lang);
        });

        // Check for blog page
        if (currentPage === 'blog.html' || currentPage === 'blog' || currentPage === '') {
            if (document.getElementById('blog-grid')) {
                this.renderBlogList();
            }
        }

        // Check for post page
        if (currentPage === 'post.html' || currentPage === 'post') {
            this.renderPost();
        }
    }
};

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    BlogSystem.init();
});
