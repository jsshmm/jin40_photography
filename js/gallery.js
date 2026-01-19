// ===== Configuration =====
const CONFIG = {
    metadataUrl: 'data/metadata.json',
    galleryGridSelector: '.gallery-grid',
    placeholderImage: 'https://picsum.photos/400/300?random=1',
    rowHeight: 10,
    rowGap: 15
};

// ===== Main Initialization =====
document.addEventListener('DOMContentLoaded', async () => {
    // 1. Load Data & Build Gallery
    await GalleryBuilder.init();

    // 2. Initialize Filters (after items exist)
    GalleryFilter.init();

    // 3. Initialize Modal
    Modal.init();
});

// ===== Gallery Builder =====
const GalleryBuilder = {
    items: [],

    async init() {
        const grid = document.querySelector(CONFIG.galleryGridSelector);
        if (!grid) return;

        try {
            const response = await fetch(CONFIG.metadataUrl);
            if (!response.ok) throw new Error('Failed to load metadata');

            this.items = await response.json();

            // Random Shuffle (fisher-yates)
            this.shuffleArray(this.items);

            // Clear loading state or empty content
            grid.innerHTML = '';

            // Render Items
            this.items.forEach((data, index) => {
                const element = this.createGalleryItem(data, index);
                grid.appendChild(element);
            });

            // Recalculate layout on resize
            let resizeTimeout;
            window.addEventListener('resize', () => {
                clearTimeout(resizeTimeout);
                resizeTimeout = setTimeout(() => this.resizeAllGalleryItems(), 100);
            });

            // Initial layout calculation after a short delay to ensure DOM is ready? 
            // Actually img.onload handles individual items.
            // But we can trigger one restrictive pass.
            // setTimeout(() => this.resizeAllGalleryItems(), 100);

        } catch (error) {
            console.error("Gallery build failed:", error);
            grid.innerHTML = '<p class="error">Failed to load gallery images.</p>';
        }
    },

    shuffleArray(array) {
        for (let i = array.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [array[i], array[j]] = [array[j], array[i]];
        }
    },

    createGalleryItem(data, index) {
        // Create container
        const div = document.createElement('div');
        div.className = 'gallery-item';

        // --- Aspect Ratio Logic ---
        // Wide (Landscape) = width > height -> span 2 cols
        // Portrait/Square = standard -> span 1 col
        if (data.width && data.height) {
            const aspect = data.width / data.height;
            // Adjustable threshold. 1.2 means clearly landscape.
            if (aspect >= 1.2) {
                div.classList.add('wide');
            }
        }

        div.dataset.category = data.category || this.getRandomCategory();
        div.dataset.country = (data.country || 'unknown').toLowerCase();
        div.dataset.year = data.year || '2025';

        // Click to Open Modal
        div.addEventListener('click', () => Modal.open(index));

        // Create Image
        const img = document.createElement('img');
        img.src = `images/gallery/${data.filePath}`;
        img.alt = `${div.dataset.category} photo from ${div.dataset.country}`;
        img.loading = 'lazy';
        img.onerror = () => { img.src = CONFIG.placeholderImage; };

        // Masonry Layout Handler
        img.onload = () => this.resizeGalleryItem(div);

        // Create Overlay
        const overlay = document.createElement('div');
        overlay.className = 'gallery-overlay';

        const h4 = document.createElement('h4');
        const p = document.createElement('p');

        // Build Overlay Content
        // Line 1: Tech Specs
        const techSpecs = [];
        if (data.focalLength) techSpecs.push(`${data.focalLength}mm`);
        if (data.aperture) techSpecs.push(`f/${data.aperture}`);
        if (data.exposureTime) {
            const time = data.exposureTime < 1 ? `1/${Math.round(1 / data.exposureTime)}s` : `${data.exposureTime}s`;
            techSpecs.push(time);
        }
        h4.textContent = techSpecs.join(' · ');

        // Line 2: Context
        const context = [];
        if (data.model || data.make) context.push(data.model || data.make);
        if (data.year) context.push(data.year);
        if (data.country) {
            const countryName = data.country.charAt(0).toUpperCase() + data.country.slice(1);
            context.push(countryName);
        }
        p.textContent = context.join(' · ');

        overlay.appendChild(h4);
        overlay.appendChild(p);
        div.appendChild(img);
        div.appendChild(overlay);

        return div;
    },

    getRandomCategory() {
        const categories = ['nature', 'urban', 'portrait', 'travel'];
        return categories[Math.floor(Math.random() * categories.length)];
    },

    resizeGalleryItem(item) {
        const grid = document.querySelector(CONFIG.galleryGridSelector);
        if (!grid) return;

        const rowHeight = CONFIG.rowHeight;

        // Dynamic row gap from CSS (handles mobile breakpoint changes)
        const rowGap = parseInt(window.getComputedStyle(grid).getPropertyValue('row-gap')) || CONFIG.rowGap;

        // Find the image inside
        const img = item.querySelector('img');
        if (!img) return;

        // Force a read to ensure layout is up to date
        const contentHeight = img.getBoundingClientRect().height;

        // If image hasn't loaded or has 0 height, skip or retry
        if (contentHeight === 0) return;

        const rowSpan = Math.ceil((contentHeight + rowGap) / (rowHeight + rowGap));

        item.style.gridRowEnd = `span ${rowSpan}`;
    },

    resizeAllGalleryItems() {
        const items = document.querySelectorAll('.gallery-item');
        items.forEach(item => this.resizeGalleryItem(item));
    }
};

// ===== Gallery Filter System =====
const GalleryFilter = {
    currentFilterType: 'country',
    galleryItems: null,
    filterTabs: null,
    filterGroups: null,

    init() {
        this.galleryItems = document.querySelectorAll('.gallery-item');
        this.filterTabs = document.querySelectorAll('.filter-tab');
        this.filterGroups = {
            country: document.getElementById('filter-country'),
            year: document.getElementById('filter-year')
        };

        if (!this.galleryItems.length || !this.filterTabs.length) return;

        this.bindEvents();
        this.showAllItems();
    },

    bindEvents() {
        this.filterTabs.forEach(tab => {
            tab.onclick = () => this.switchTab(tab);
        });

        Object.values(this.filterGroups).forEach(group => {
            if (!group) return;
            group.querySelectorAll('.filter-btn').forEach(btn => {
                btn.onclick = () => this.applyFilter(btn, group);
            });
        });
    },

    switchTab(tab) {
        const filterType = tab.dataset.filterType;
        this.filterTabs.forEach(t => t.classList.remove('active'));
        tab.classList.add('active');

        Object.entries(this.filterGroups).forEach(([type, group]) => {
            if (!group) return;
            group.style.display = type === filterType ? 'flex' : 'none';
        });

        this.currentFilterType = filterType;

        const activeGroup = this.filterGroups[filterType];
        if (activeGroup) {
            activeGroup.querySelectorAll('.filter-btn').forEach(btn => {
                btn.classList.toggle('active', btn.dataset.filter === 'all');
            });
        }
        this.showAllItems();
    },

    applyFilter(btn, group) {
        group.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');

        const filterValue = btn.dataset.filter;
        const filterType = this.currentFilterType;

        this.galleryItems.forEach(item => {
            const itemValue = item.dataset[filterType];
            const isMatch = filterValue === 'all' || itemValue === filterValue;

            if (isMatch) {
                item.classList.remove('hide');
                item.style.display = ''; // Reset display for grid
                item.style.animation = 'fadeIn 0.5s ease forwards';
                // Trigger resize for this item to ensure grid placement is correct?
                // Actually grid handles it, but if it was display:none, height might have been 0.
                GalleryBuilder.resizeGalleryItem(item);
            } else {
                item.classList.add('hide');
                // We must hide it completely for grid to repack
                setTimeout(() => { if (item.classList.contains('hide')) item.style.display = 'none'; }, 500); // After animation
                // Or immediately set display: none if we don't care about fade out spacing
                item.style.display = 'none';
            }
        });

        // Trigger a global resize after filtering to be safe
        setTimeout(() => GalleryBuilder.resizeAllGalleryItems(), 50);
    },

    showAllItems() {
        this.galleryItems.forEach(item => {
            item.classList.remove('hide');
            item.style.display = '';
            item.style.animation = 'fadeIn 0.5s ease forwards';
            GalleryBuilder.resizeGalleryItem(item);
        });
    }
};

// ===== Modal System =====
const Modal = {
    modal: null,
    img: null,
    caption: null,
    closeBtn: null,
    prevBtn: null,
    nextBtn: null,
    currentIndex: 0,

    init() {
        this.modal = document.getElementById('imageModal');
        this.img = document.getElementById('modalImage');
        this.caption = document.getElementById('modalCaption');
        this.closeBtn = document.querySelector('.modal-close');
        this.prevBtn = document.querySelector('.modal-prev');
        this.nextBtn = document.querySelector('.modal-next');

        if (!this.modal) return;

        // Events
        this.closeBtn.onclick = () => this.close();
        this.prevBtn.onclick = (e) => { e.stopPropagation(); this.prev(); };
        this.nextBtn.onclick = (e) => { e.stopPropagation(); this.next(); };

        // Close on background click
        this.modal.onclick = (e) => {
            if (e.target === this.modal) this.close();
        };

        // Keyboard navigation
        document.addEventListener('keydown', (e) => {
            if (!this.modal.classList.contains('active')) return;
            if (e.key === 'Escape') this.close();
            if (e.key === 'ArrowLeft') this.prev();
            if (e.key === 'ArrowRight') this.next();
        });
    },

    open(index) {
        if (index < 0 || index >= GalleryBuilder.items.length) return;
        this.currentIndex = index;
        this.updateModalContent();
        this.modal.classList.add('active');
        document.body.style.overflow = 'hidden'; // Prevent scrolling
    },

    close() {
        this.modal.classList.remove('active');
        document.body.style.overflow = '';
    },

    prev() {
        this.currentIndex = (this.currentIndex - 1 + GalleryBuilder.items.length) % GalleryBuilder.items.length;
        this.updateModalContent();
    },

    next() {
        this.currentIndex = (this.currentIndex + 1) % GalleryBuilder.items.length;
        this.updateModalContent();
    },

    updateModalContent() {
        const data = GalleryBuilder.items[this.currentIndex];
        this.img.src = `images/gallery/${data.filePath}`;

        // Caption
        let exposure = '';
        if (data.exposureTime) {
            exposure = data.exposureTime < 1 ? `1/${Math.round(1 / data.exposureTime)}s` : `${data.exposureTime}s`;
        }

        const techParts = [];
        if (data.focalLength) techParts.push(`${data.focalLength}mm`);
        if (data.aperture) techParts.push(`f/${data.aperture}`);
        if (exposure) techParts.push(exposure);

        const tech = techParts.join(' · ');
        const ctx = `${data.model || ''} · ${data.year}`;
        this.caption.textContent = `${tech} | ${ctx}`;
    }
};
