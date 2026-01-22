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
const filterBtns = document.querySelectorAll('.filter-btn');
const galleryItems = document.querySelectorAll('.gallery-item');
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

// ===== Gallery Filter =====
if (filterBtns.length > 0 && galleryItems.length > 0) {
    filterBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            // Update active button
            filterBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');

            const filter = btn.dataset.filter;

            // Filter gallery items
            galleryItems.forEach(item => {
                if (filter === 'all' || item.dataset.category === filter) {
                    item.classList.remove('hide');
                    item.style.animation = 'fadeIn 0.5s ease forwards';
                } else {
                    item.classList.add('hide');
                }
            });
        });
    });
}

// ===== Gallery Modal =====
let currentImageIndex = 0;
let visibleImages = [];

function updateVisibleImages() {
    visibleImages = Array.from(galleryItems).filter(item => !item.classList.contains('hide'));
}

function openModal(index) {
    updateVisibleImages();
    currentImageIndex = index;

    const item = visibleImages[index];
    const img = item.querySelector('img');
    const title = item.querySelector('h4')?.textContent || '';

    modal.classList.add('active');
    modalImg.src = img.src;
    modalCaption.textContent = title;

    document.body.style.overflow = 'hidden';
}

function closeModal() {
    modal.classList.remove('active');
    document.body.style.overflow = '';
}

function showPrevImage() {
    currentImageIndex = (currentImageIndex - 1 + visibleImages.length) % visibleImages.length;
    const item = visibleImages[currentImageIndex];
    const img = item.querySelector('img');
    const title = item.querySelector('h4')?.textContent || '';

    modalImg.src = img.src;
    modalCaption.textContent = title;
}

function showNextImage() {
    currentImageIndex = (currentImageIndex + 1) % visibleImages.length;
    const item = visibleImages[currentImageIndex];
    const img = item.querySelector('img');
    const title = item.querySelector('h4')?.textContent || '';

    modalImg.src = img.src;
    modalCaption.textContent = title;
}

// Gallery item click handlers
if (galleryItems.length > 0) {
    galleryItems.forEach((item, index) => {
        item.addEventListener('click', () => {
            updateVisibleImages();
            const visibleIndex = visibleImages.indexOf(item);
            if (visibleIndex !== -1) {
                openModal(visibleIndex);
            }
        });
    });
}

// Modal controls
if (modal) {
    modalClose?.addEventListener('click', closeModal);
    modalPrev?.addEventListener('click', showPrevImage);
    modalNext?.addEventListener('click', showNextImage);

    // Close modal when clicking outside image
    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            closeModal();
        }
    });

    // Keyboard navigation
    document.addEventListener('keydown', (e) => {
        if (!modal.classList.contains('active')) return;

        if (e.key === 'Escape') closeModal();
        if (e.key === 'ArrowLeft') showPrevImage();
        if (e.key === 'ArrowRight') showNextImage();
    });
}

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

// 2. Run-Once Observer (For Gallery Page: fade in once, then stay)
const onceObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            entry.target.classList.add('fade-in');
            onceObserver.unobserve(entry.target);
        }
    });
}, observerOptions);

// Observe elements for animation
// Home elements -> Replay
document.querySelectorAll('.featured-item, .blog-card, .about-content').forEach(el => {
    el.style.opacity = '0';
    replayObserver.observe(el);
});

// Gallery items -> Run Once
document.querySelectorAll('.gallery-item').forEach(el => {
    el.style.opacity = '0';
    onceObserver.observe(el);
});
// Note: Dynamic gallery items are observed in gallery.js, make sure to update there if needed or export these.
// Actually gallery.js handles its own observers effectively via CSS animations or we can expose this.
// Given separate files, let's keep gallery.js independent but consistent.
// However, the user specifically mentioned "gallery tab".
// js/gallery.js uses "item.style.animation = 'fadeIn...'" manually in filtering, 
// so it might clash with this global observer if not careful.
// But wait, the previous code observed .gallery-item here in main.js.
// Since gallery items are dynamic, this main.js code only caches initial ones? 
// Actually gallery.js loads items dynamically. This selector might be empty on load.
// Let's ensure gallery.js uses the right logic. 
// For now, let's just definition separate strategies here if used.

// ===== Lazy Loading Images =====
if ('loading' in HTMLImageElement.prototype) {
    // Browser supports native lazy loading
    document.querySelectorAll('img').forEach(img => {
        if (!img.hasAttribute('loading')) {
            img.setAttribute('loading', 'lazy');
        }
    });
} else {
    // Fallback for browsers without native lazy loading
    const lazyImages = document.querySelectorAll('img[loading="lazy"]');

    const lazyObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const img = entry.target;
                img.src = img.dataset.src || img.src;
                lazyObserver.unobserve(img);
            }
        });
    });

    lazyImages.forEach(img => lazyObserver.observe(img));
}

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

// ===== Featured Items Hover Effect =====
document.querySelectorAll('.featured-item').forEach(item => {
    item.addEventListener('click', () => {
        window.location.href = 'gallery.html';
    });
});

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
