// ===== Blog System =====
// Handles markdown-based blog functionality

const BlogSystem = {
    postsIndexUrl: './posts/index.json',
    postsDir: './posts/',

    // Format date to English
    formatDate(dateStr) {
        const date = new Date(dateStr);
        const options = { year: 'numeric', month: 'long', day: 'numeric' };
        return date.toLocaleDateString('en-US', options);
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
            console.log('Fetching posts from:', this.postsIndexUrl);
            const response = await fetch(this.postsIndexUrl);
            console.log('Response status:', response.status);
            if (!response.ok) throw new Error(`Failed to fetch posts index: ${response.status}`);
            const data = await response.json();
            console.log('Posts loaded:', data.length);
            return data;
        } catch (error) {
            console.error('Error fetching posts index:', error);
            return [];
        }
    },

    // Fetch single post markdown
    async fetchPost(slug) {
        try {
            const response = await fetch(`${this.postsDir}${slug}.md`);
            if (!response.ok) throw new Error('Failed to fetch post');
            return await response.text();
        } catch (error) {
            console.error('Error fetching post:', error);
            return null;
        }
    },

    // Render blog list (for blog.html)
    async renderBlogList() {
        const blogGrid = document.getElementById('blog-grid');
        const blogLoading = document.getElementById('blog-loading');
        const blogEmpty = document.getElementById('blog-empty');

        if (!blogGrid) return;

        try {
            const posts = await this.fetchPostsIndex();

            // Sort by date (newest first)
            posts.sort((a, b) => new Date(b.date) - new Date(a.date));

            blogLoading.style.display = 'none';

            if (posts.length === 0) {
                blogEmpty.style.display = 'block';
                return;
            }

            blogGrid.innerHTML = posts.map(post => `
                <article class="blog-card">
                    <div class="blog-image">
                        <a href="post.html?slug=${post.slug}">
                            <img src="${post.thumbnail}" alt="${post.title}"
                                 onerror="this.src='https://picsum.photos/600/400?random=${Math.random()}'">
                        </a>
                        <span class="blog-category">${post.category}</span>
                    </div>
                    <div class="blog-content">
                        <div class="blog-meta">
                            <span class="blog-date">${this.formatDate(post.date)}</span>
                        </div>
                        <h3><a href="post.html?slug=${post.slug}">${post.title}</a></h3>
                        <p>${post.excerpt}</p>
                        <a href="post.html?slug=${post.slug}" class="read-more">Read more &rarr;</a>
                    </div>
                </article>
            `).join('');

            // Add fade-in animation
            blogGrid.querySelectorAll('.blog-card').forEach((card, index) => {
                card.style.opacity = '0';
                card.style.animation = `fadeIn 0.5s ease ${index * 0.1}s forwards`;
            });

        } catch (error) {
            blogLoading.style.display = 'none';
            blogEmpty.innerHTML = '<p>Error loading posts. Please try again later.</p>';
            blogEmpty.style.display = 'block';
        }
    },

    // Render single post (for post.html)
    async renderPost() {
        const postTitle = document.getElementById('post-title');
        const postCategory = document.getElementById('post-category');
        const postDate = document.getElementById('post-date');
        const postThumbnail = document.getElementById('post-thumbnail');
        const postBody = document.getElementById('post-body');
        const postLoading = document.getElementById('post-loading');
        const postError = document.getElementById('post-error');
        const relatedPosts = document.getElementById('related-posts');
        const relatedGrid = document.getElementById('related-grid');

        if (!postBody) return;

        // Get slug from URL
        const urlParams = new URLSearchParams(window.location.search);
        const slug = urlParams.get('slug');

        if (!slug) {
            postLoading.style.display = 'none';
            postError.style.display = 'block';
            return;
        }

        try {
            // Fetch post content
            const markdown = await this.fetchPost(slug);

            if (!markdown) {
                postLoading.style.display = 'none';
                postError.style.display = 'block';
                return;
            }

            // Parse frontmatter and content
            const { metadata, content } = this.parseFrontmatter(markdown);

            // Update page elements
            postTitle.textContent = metadata.title || 'Untitled';
            postCategory.textContent = metadata.category || 'General';
            postDate.textContent = metadata.date ? this.formatDate(metadata.date) : '';

            if (metadata.thumbnail) {
                postThumbnail.src = metadata.thumbnail;
                postThumbnail.alt = metadata.title;
            }

            // Update page title
            document.title = `${metadata.title} - Photography Portfolio`;

            // Render markdown content
            if (typeof marked !== 'undefined') {
                marked.setOptions({
                    breaks: true,
                    gfm: true
                });
                postBody.innerHTML = marked.parse(content);
            } else {
                // Fallback: simple markdown rendering
                postBody.innerHTML = this.simpleMarkdownRender(content);
            }

            postLoading.style.display = 'none';

            // Render related posts
            await this.renderRelatedPosts(slug, relatedPosts, relatedGrid);

        } catch (error) {
            console.error('Error rendering post:', error);
            postLoading.style.display = 'none';
            postError.style.display = 'block';
        }
    },

    // Simple markdown renderer (fallback)
    simpleMarkdownRender(markdown) {
        return markdown
            // Headers
            .replace(/^### (.*$)/gm, '<h3>$1</h3>')
            .replace(/^## (.*$)/gm, '<h2>$1</h2>')
            .replace(/^# (.*$)/gm, '<h1>$1</h1>')
            // Bold
            .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
            // Italic
            .replace(/\*(.*?)\*/g, '<em>$1</em>')
            // Images
            .replace(/!\[(.*?)\]\((.*?)\)/g, '<img src="$2" alt="$1">')
            // Links
            .replace(/\[(.*?)\]\((.*?)\)/g, '<a href="$2">$1</a>')
            // Blockquotes
            .replace(/^> (.*$)/gm, '<blockquote>$1</blockquote>')
            // Lists
            .replace(/^- (.*$)/gm, '<li>$1</li>')
            .replace(/(<li>.*<\/li>)/s, '<ul>$1</ul>')
            // Paragraphs
            .replace(/\n\n/g, '</p><p>')
            .replace(/^(.+)$/gm, '<p>$1</p>')
            // Clean up
            .replace(/<p><\/p>/g, '')
            .replace(/<p>(<h[1-6]>)/g, '$1')
            .replace(/(<\/h[1-6]>)<\/p>/g, '$1')
            .replace(/<p>(<blockquote>)/g, '$1')
            .replace(/(<\/blockquote>)<\/p>/g, '$1')
            .replace(/<p>(<ul>)/g, '$1')
            .replace(/(<\/ul>)<\/p>/g, '$1')
            .replace(/<p>(<img)/g, '$1')
            .replace(/(>)<\/p>/g, '$1');
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

            grid.innerHTML = otherPosts.map(post => `
                <a href="post.html?slug=${post.slug}" class="related-card">
                    <img src="${post.thumbnail}" alt="${post.title}"
                         onerror="this.src='https://picsum.photos/300/200?random=${Math.random()}'">
                    <h4>${post.title}</h4>
                </a>
            `).join('');

            container.style.display = 'block';

        } catch (error) {
            console.error('Error rendering related posts:', error);
        }
    },

    // Initialize based on current page
    init() {
        const currentPage = window.location.pathname.split('/').pop();
        console.log('BlogSystem init - currentPage:', currentPage);

        // Check for blog page (with or without .html extension)
        if (currentPage === 'blog.html' || currentPage === 'blog' || currentPage === '') {
            const blogGrid = document.getElementById('blog-grid');
            console.log('Blog page detected, blogGrid element:', blogGrid ? 'found' : 'not found');
            if (blogGrid) {
                this.renderBlogList();
            }
        }

        // Check for post page (with or without .html extension)
        if (currentPage === 'post.html' || currentPage === 'post') {
            this.renderPost();
        }
    }
};

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    BlogSystem.init();
});
