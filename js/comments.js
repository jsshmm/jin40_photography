/**
 * Comment System for jin40_photography
 * Uses Supabase as backend
 */
const CommentSystem = {
    supabaseUrl: 'https://movsdupsydzzwivbnqpx.supabase.co',
    supabaseKey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1vdnNkdXBzeWR6endpdmJucXB4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjkyOTYzNTgsImV4cCI6MjA4NDg3MjM1OH0.7vUnZsoQXtnBpnWdjhbrhLP_6YdTU3roFfr6SEILEhw',
    postSlug: null,

    /**
     * Initialize the comment system
     * @param {string|null} postSlug - null for guestbook, string for blog post comments
     */
    async init(postSlug = null) {
        this.postSlug = postSlug;
        await this.loadComments();
        this.setupForm();
    },

    /**
     * Load comments from Supabase
     */
    async loadComments() {
        const container = document.getElementById('comments-list');
        if (!container) return;

        container.innerHTML = '<div class="loading-comments">Loading...</div>';

        try {
            let url = `${this.supabaseUrl}/rest/v1/comments?is_approved=eq.true&order=created_at.desc`;

            if (this.postSlug) {
                url += `&post_slug=eq.${encodeURIComponent(this.postSlug)}`;
            } else {
                url += '&post_slug=is.null';
            }

            const response = await fetch(url, {
                headers: {
                    'apikey': this.supabaseKey,
                    'Authorization': `Bearer ${this.supabaseKey}`
                }
            });

            if (!response.ok) throw new Error('Failed to load comments');

            const comments = await response.json();
            this.renderComments(comments, container);
        } catch (error) {
            console.error('Error loading comments:', error);
            container.innerHTML = '<div class="no-comments">Unable to load comments. Please try again later.</div>';
        }
    },

    /**
     * Render comments to the container
     */
    renderComments(comments, container) {
        if (comments.length === 0) {
            container.innerHTML = '<div class="no-comments">No messages yet. Be the first to leave one!</div>';
            return;
        }

        container.innerHTML = comments.map(comment => `
            <div class="comment-item">
                <div class="comment-header">
                    <span class="comment-author">${this.escapeHtml(comment.author_name)}</span>
                    <span class="comment-date">${this.formatDate(comment.created_at)}</span>
                </div>
                <div class="comment-message">${this.escapeHtml(comment.message)}</div>
            </div>
        `).join('');
    },

    /**
     * Setup form submission handler
     */
    setupForm() {
        const form = document.getElementById('comment-form');
        if (!form) return;

        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            await this.submitComment(form);
        });
    },

    /**
     * Submit a new comment
     */
    async submitComment(form) {
        const submitBtn = form.querySelector('button[type="submit"]');
        const messageDiv = document.getElementById('comment-message');

        const formData = new FormData(form);
        const name = formData.get('name')?.trim();
        const message = formData.get('message')?.trim();
        const honeypot = formData.get('website')?.trim();

        // Honeypot check - if filled, silently reject
        if (honeypot) {
            this.showMessage('success', messageDiv);
            form.reset();
            return;
        }

        // Validation
        if (!name || !message) {
            this.showMessage('error', messageDiv, 'Please fill in all fields.');
            return;
        }

        // Disable submit button
        submitBtn.disabled = true;
        submitBtn.textContent = 'Submitting...';

        try {
            const response = await fetch(`${this.supabaseUrl}/rest/v1/comments`, {
                method: 'POST',
                headers: {
                    'apikey': this.supabaseKey,
                    'Authorization': `Bearer ${this.supabaseKey}`,
                    'Content-Type': 'application/json',
                    'Prefer': 'return=minimal'
                },
                body: JSON.stringify({
                    post_slug: this.postSlug,
                    author_name: name,
                    message: message,
                    honeypot: honeypot || null
                })
            });

            if (!response.ok) throw new Error('Failed to submit');

            this.showMessage('success', messageDiv);
            form.reset();
        } catch (error) {
            console.error('Error submitting comment:', error);
            this.showMessage('error', messageDiv);
        } finally {
            submitBtn.disabled = false;
            submitBtn.textContent = 'Submit';
        }
    },

    /**
     * Show success or error message
     */
    showMessage(type, container, customMessage = null) {
        if (!container) return;

        const messages = {
            success: 'Thank you! Your message will appear after review.',
            error: customMessage || 'Failed to submit. Please try again.'
        };

        container.className = `comment-message-${type}`;
        container.textContent = messages[type];
        container.style.display = 'block';

        // Auto-hide after 5 seconds
        setTimeout(() => {
            container.style.display = 'none';
        }, 5000);
    },

    /**
     * Escape HTML to prevent XSS
     */
    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    },

    /**
     * Format date for display
     */
    formatDate(dateStr) {
        const date = new Date(dateStr);
        return date.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    }
};
