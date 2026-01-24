// ===== Scroll Restoration Fix =====
// Disable browser's automatic scroll restoration
if ('scrollRestoration' in history) {
    history.scrollRestoration = 'manual';
}

// Scroll to top on page load
window.addEventListener('load', () => {
    window.scrollTo(0, 0);
});

// ===== DOM Elements =====
const navToggle = document.querySelector('.nav-toggle');
const navMenu = document.querySelector('.nav-menu');
const modal = document.getElementById('imageModal');
const modalImg = document.getElementById('modalImage');
const modalCaption = document.getElementById('modalCaption');
const modalClose = document.querySelector('.modal-close');
const modalPrev = document.querySelector('.modal-prev');
const modalNext = document.querySelector('.modal-next');

// ===== Mobile Navigation =====
if (navToggle && navMenu) {
    navToggle.addEventListener('click', () => {
        navToggle.classList.toggle('active');
        navMenu.classList.toggle('active');
    });

    // Close menu when clicking on a link
    navMenu.querySelectorAll('a').forEach(link => {
        link.addEventListener('click', () => {
            navToggle.classList.remove('active');
            navMenu.classList.remove('active');
        });
    });

    // Close menu when clicking outside
    document.addEventListener('click', (e) => {
        if (!navToggle.contains(e.target) && !navMenu.contains(e.target)) {
            navToggle.classList.remove('active');
            navMenu.classList.remove('active');
        }
    });

    // Close menu on scroll
    window.addEventListener('scroll', () => {
        if (navMenu.classList.contains('active')) {
            navToggle.classList.remove('active');
            navMenu.classList.remove('active');
        }
    }, { passive: true });
}

// ===== Navbar Scroll Effect =====
let lastScroll = 0;
const navbar = document.querySelector('.navbar');

window.addEventListener('scroll', () => {
    const currentScroll = window.pageYOffset;

    // Smart Navbar Logic
    if (currentScroll > lastScroll && currentScroll > 80) {
        // Scroll Down -> Hide
        navbar.classList.add('hidden');
    } else {
        // Scroll Up -> Show
        navbar.classList.remove('hidden');
    }

    if (currentScroll > 100) {
        navbar.style.boxShadow = '0 2px 20px rgba(0, 0, 0, 0.15)';
    } else {
        navbar.style.boxShadow = '0 2px 10px rgba(0, 0, 0, 0.1)';
    }

    lastScroll = currentScroll;
});

// ===== Reusable Lightbox Modal Logic =====
window.initImageModal = function (selector) {
    const images = document.querySelectorAll(selector);
    if (images.length === 0) return;

    let visibleImages = Array.from(images).filter(img => {
        // For gallery items, check if parent is hidden
        const item = img.closest('.gallery-item');
        return item ? !item.classList.contains('hide') : true;
    });

    let currentImageIndex = 0;
    const modal = document.getElementById('imageModal');
    const modalImg = document.getElementById('modalImage');
    const modalCaption = document.getElementById('modalCaption');
    const modalClose = document.querySelector('.modal-close');
    const modalPrev = document.querySelector('.modal-prev');
    const modalNext = document.querySelector('.modal-next');

    if (!modal) return;

    function openModal(index) {
        // Refresh visible images list in case of filtering
        visibleImages = Array.from(document.querySelectorAll(selector)).filter(img => {
            const item = img.closest('.gallery-item');
            return item ? !item.classList.contains('hide') : true;
        });

        // Find correct index in potentially filtered list
        const clickedImg = images[index];
        const newIndex = visibleImages.indexOf(clickedImg);

        if (newIndex === -1) return;
        currentImageIndex = newIndex;

        const img = visibleImages[currentImageIndex];
        // For gallery items, title is in h4 sibling. For blog, use empty string.
        const item = img.closest('.gallery-item');
        const title = item ? (item.querySelector('h4')?.textContent || '') : '';

        modal.classList.add('active');
        modalImg.src = img.src || img.dataset.src;
        modalCaption.textContent = title;
        document.body.style.overflow = 'hidden';
    }

    function closeModal() {
        modal.classList.remove('active');
        document.body.style.overflow = '';
    }

    function showPrevImage() {
        currentImageIndex = (currentImageIndex - 1 + visibleImages.length) % visibleImages.length;
        const img = visibleImages[currentImageIndex];
        const item = img.closest('.gallery-item');
        const title = item ? (item.querySelector('h4')?.textContent || '') : '';
        modalImg.src = img.src || img.dataset.src;
        modalCaption.textContent = title;
    }

    function showNextImage() {
        currentImageIndex = (currentImageIndex + 1) % visibleImages.length;
        const img = visibleImages[currentImageIndex];
        const item = img.closest('.gallery-item');
        const title = item ? (item.querySelector('h4')?.textContent || '') : '';
        modalImg.src = img.src || img.dataset.src;
        modalCaption.textContent = title;
    }

    // Attach click listeners
    images.forEach((img, index) => {
        // If inside a link, don't trigger modal (unless preventing default, but safe to assume no link wrapper for now)
        // If image has parent .gallery-item, attach to it instead?
        // Old logic attached to .gallery-item. New logic attaches to image or wrapper.
        // To keep consistent with old behavior:
        const trigger = img.closest('.gallery-item') || img;
        trigger.style.cursor = 'pointer';

        trigger.addEventListener('click', (e) => {
            e.preventDefault();
            openModal(index);
        });
    });

    // Event Listeners (only attach once per modal element)
    if (!modal.dataset.init) {
        modalClose?.addEventListener('click', closeModal);
        modalPrev?.addEventListener('click', showPrevImage);
        modalNext?.addEventListener('click', showNextImage);

        modal.addEventListener('click', (e) => {
            if (e.target === modal) closeModal();
        });

        document.addEventListener('keydown', (e) => {
            if (!modal.classList.contains('active')) return;
            if (e.key === 'Escape') closeModal();
            if (e.key === 'ArrowLeft') showPrevImage();
            if (e.key === 'ArrowRight') showNextImage();
        });

        modal.dataset.init = 'true';
    }
};

// ===== Smooth Scroll for Anchor Links =====
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        const href = this.getAttribute('href');
        if (href === '#') return;

        e.preventDefault();
        const target = document.querySelector(href);

        if (target) {
            const offset = 80; // Navbar height
            const targetPosition = target.getBoundingClientRect().top + window.pageYOffset - offset;

            window.scrollTo({
                top: targetPosition,
                behavior: 'smooth'
            });
        }
    });
});

// ===== Intersection Observer for Fade-in Animation =====
const observerOptions = {
    root: null,
    rootMargin: '0px',
    threshold: 0.1
};

// 1. Replay Observer (For Home Page: fade in/out every time)
const replayObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            entry.target.classList.add('fade-in');
        } else {
            entry.target.classList.remove('fade-in');
        }
    });
}, observerOptions);

// Observe elements for animation
// Home elements -> Replay
document.querySelectorAll('.featured-item, .blog-card, .about-content').forEach(el => {
    el.style.opacity = '0';
    replayObserver.observe(el);
});

// ===== Lazy Loading Images =====
document.querySelectorAll('img').forEach(img => {
    if (!img.hasAttribute('loading')) {
        img.setAttribute('loading', 'lazy');
    }
});

// ===== Active Navigation Link =====
function setActiveNavLink() {
    const currentPage = window.location.pathname.split('/').pop() || 'index.html';

    document.querySelectorAll('.nav-menu a').forEach(link => {
        const href = link.getAttribute('href');
        if (href === currentPage || (currentPage === '' && href === 'index.html')) {
            link.classList.add('active');
        } else {
            link.classList.remove('active');
        }
    });
}

setActiveNavLink();

// ===== Translation System =====
const TranslationSystem = {
    currentLang: localStorage.getItem('selectedLang') || 'en',
    translations: {},

    async init() {
        try {
            const response = await fetch('data/translations.json');
            this.translations = await response.json();

            this.setupLanguageSwitcher();
            this.applyTranslations(this.currentLang);

            // Dispatch event for other scripts (like blog.js)
            window.dispatchEvent(new CustomEvent('languageChanged', {
                detail: { lang: this.currentLang }
            }));
        } catch (error) {
            console.error('Failed to load translations:', error);
        }
    },

    setupLanguageSwitcher() {
        const langBtn = document.querySelector('.lang-btn');
        const langDropdown = document.querySelector('.lang-dropdown');
        const langOptions = document.querySelectorAll('.lang-option');

        if (!langBtn || !langDropdown) return;

        // Set initial active state
        this.updateActiveLangOption(this.currentLang);

        // Toggle dropdown
        langBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            langDropdown.classList.toggle('active');
        });

        // Close dropdown when clicking outside
        document.addEventListener('click', () => {
            langDropdown.classList.remove('active');
        });

        // Close dropdown on scroll
        window.addEventListener('scroll', () => {
            if (langDropdown.classList.contains('active')) {
                langDropdown.classList.remove('active');
            }
        }, { passive: true });

        // Handle language selection
        langOptions.forEach(option => {
            option.addEventListener('click', (e) => {
                const lang = e.currentTarget.dataset.lang;
                this.setLanguage(lang);
            });
        });
    },

    setLanguage(lang) {
        this.currentLang = lang;
        localStorage.setItem('selectedLang', lang);

        // Update UI
        this.updateActiveLangOption(lang);
        this.applyTranslations(lang);

        // Dispatch event
        window.dispatchEvent(new CustomEvent('languageChanged', {
            detail: { lang: lang }
        }));
    },

    updateActiveLangOption(lang) {
        document.querySelectorAll('.lang-option').forEach(opt => {
            if (opt.dataset.lang === lang) {
                opt.classList.add('active');
                // Update button text if needed, or just icon
                // const langLabel = opt.querySelector('span').textContent;
                // document.querySelector('.current-lang').textContent = langLabel;
            } else {
                opt.classList.remove('active');
            }
        });
    },

    applyTranslations(lang) {
        document.querySelectorAll('[data-i18n]').forEach(el => {
            const key = el.dataset.i18n;
            const keys = key.split('.');
            let value = this.translations;

            for (const k of keys) {
                value = value?.[k];
            }

            const translatedText = value?.[lang];
            if (translatedText) {
                // If element has child nodes that are not text (like span inside h1), handle carefully
                // For simple text replacement:
                if (el.children.length === 0) {
                    el.textContent = translatedText;
                } else {
                    // Special handling for mixed content (like Header "Hello, I'm [span]...")
                    // We might need specific logic or data-i18n-html
                    // For now, let's assume specific structure or use innerHTML if safe
                    // Better approach: separate text nodes with spans and simple IDs
                }
            }
        });
    },
};

// Initialize Translation System
document.addEventListener('DOMContentLoaded', () => {
    TranslationSystem.init();
});

// ===== Console Welcome Message =====
console.log('%c Photography Portfolio ', 'background: #2c3e50; color: white; padding: 10px 20px; font-size: 16px;');
console.log('Thanks for checking out my portfolio!');

// ===== Featured Works Dynamic Loading =====
async function loadFeaturedWorks() {
    const featuredGrid = document.getElementById('featured-grid');
    if (!featuredGrid) return;

    try {
        const response = await fetch('data/metadata.json');
        if (!response.ok) throw new Error('Failed to load metadata');

        const items = await response.json();

        // Shuffle and pick 3 random items
        const shuffled = items.sort(() => Math.random() - 0.5);
        const featured = shuffled.slice(0, 3);

        // Clear grid
        featuredGrid.innerHTML = '';

        // Create featured items
        featured.forEach(data => {
            const div = document.createElement('div');
            div.className = 'featured-item';

            const img = document.createElement('img');
            img.src = `images/gallery/${data.filePath}`;
            img.alt = `${data.country || 'Photo'} - ${data.year || ''}`;
            img.loading = 'lazy';
            img.onerror = () => { img.src = 'https://picsum.photos/400/300?random=' + Math.random(); };

            const overlay = document.createElement('div');
            overlay.className = 'featured-overlay';

            const h4 = document.createElement('h4');
            const context = [];
            if (data.country) context.push(data.country.charAt(0).toUpperCase() + data.country.slice(1));
            if (data.year) context.push(data.year);
            h4.textContent = context.join(' · ') || 'Featured';

            overlay.appendChild(h4);
            div.appendChild(img);
            div.appendChild(overlay);
            featuredGrid.appendChild(div);

            // Re-observe for fade-in animation
            div.style.opacity = '0';
            replayObserver.observe(div);
        });

    } catch (error) {
        console.error('Failed to load featured works:', error);
        featuredGrid.innerHTML = '<p class="error">Failed to load featured works.</p>';
    }
}

// Load featured works on page load
document.addEventListener('DOMContentLoaded', loadFeaturedWorks);
