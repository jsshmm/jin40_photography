// ===== Configuration =====
const CONFIG = {
    metadataUrl: 'data/metadata.json',
    galleryGridSelector: '.gallery-grid',
    placeholderImage: 'https://picsum.photos/400/300?random=1',
    rowHeight: 10,
    rowGap: 15,
    initialLoadCount: 30,
    loadMoreCount: 30
};

// ===== Utility Functions =====
function formatPhotoInfo(data) {
    // Tech specs
    const techSpecs = [];
    if (data.focalLength) techSpecs.push(`${data.focalLength}mm`);
    if (data.aperture) techSpecs.push(`f/${data.aperture}`);
    if (data.exposureTime) {
        const time = data.exposureTime < 1 ? `1/${Math.round(1 / data.exposureTime)}s` : `${data.exposureTime}s`;
        techSpecs.push(time);
    }

    // Camera (add make only if model doesn't already contain it)
    let camera = data.model || '';
    if (data.make && data.model && !data.model.toUpperCase().includes(data.make.toUpperCase().split(' ')[0])) {
        camera = `${data.make} ${data.model}`;
    }

    // Country
    const country = data.country ? data.country.charAt(0).toUpperCase() + data.country.slice(1) : '';

    return {
        techLine: techSpecs.join(' · '),
        contextLine: [camera, data.year, country].filter(Boolean).join(' · ')
    };
}

// ===== Main Initialization =====
document.addEventListener('DOMContentLoaded', async () => {
    await GalleryBuilder.init();
    GalleryFilter.init();
    Modal.init();
});

// ===== Gallery Builder =====
const GalleryBuilder = {
    allItems: [],        // Original metadata (never modified)
    filteredData: [],    // Current filtered & shuffled data
    currentLoadedCount: 0,
    loadMoreBtn: null,

    async init() {
        const grid = document.querySelector(CONFIG.galleryGridSelector);
        if (!grid) {
            console.error('Gallery grid not found');
            return;
        }

        try {
            const response = await fetch(CONFIG.metadataUrl);
            if (!response.ok) throw new Error('Failed to load metadata');

            this.allItems = await response.json();
            console.log('Loaded items:', this.allItems.length);

            // Setup Load More button
            this.loadMoreBtn = document.getElementById('loadMoreBtn');
            if (this.loadMoreBtn) {
                this.loadMoreBtn.onclick = () => this.loadMore();
            }

            // Recalculate layout on resize
            let resizeTimeout;
            window.addEventListener('resize', () => {
                clearTimeout(resizeTimeout);
                resizeTimeout = setTimeout(() => this.resizeAllGalleryItems(), 100);
            });

        } catch (error) {
            console.error("Gallery build failed:", error);
            grid.innerHTML = '<p class="error">Failed to load gallery images.</p>';
        }
    },

    // Filter and render fresh gallery
    renderFiltered(filterType, filterValue) {
        console.log('renderFiltered called:', filterType, filterValue);
        console.log('allItems count:', this.allItems.length);

        const grid = document.querySelector(CONFIG.galleryGridSelector);
        if (!grid) {
            console.error('Grid not found in renderFiltered');
            return;
        }

        // Clear current gallery
        grid.innerHTML = '';
        this.currentLoadedCount = 0;

        // Filter items from original data
        if (filterValue === 'all') {
            this.filteredData = [...this.allItems];
        } else {
            this.filteredData = this.allItems.filter(item => {
                const itemValue = (item[filterType] || '').toLowerCase();
                return itemValue === filterValue;
            });
        }

        console.log('Filtered data count:', this.filteredData.length);

        // Shuffle filtered data
        this.shuffleArray(this.filteredData);

        // Render initial batch
        this.renderBatch(CONFIG.initialLoadCount);

        // Update empty state
        this.updateEmptyState();
    },

    renderBatch(count) {
        const grid = document.querySelector(CONFIG.galleryGridSelector);
        if (!grid) {
            console.error('Grid not found in renderBatch');
            return;
        }

        const startIndex = this.currentLoadedCount;
        const endIndex = Math.min(startIndex + count, this.filteredData.length);
        console.log('renderBatch:', startIndex, 'to', endIndex);

        for (let i = startIndex; i < endIndex; i++) {
            const element = this.createGalleryItem(this.filteredData[i], i);
            grid.appendChild(element);
        }

        console.log('Grid children after render:', grid.children.length);
        this.currentLoadedCount = endIndex;
        this.updateLoadMoreButton();
    },

    loadMore() {
        this.renderBatch(CONFIG.loadMoreCount);
    },

    updateLoadMoreButton() {
        if (!this.loadMoreBtn) return;

        if (this.currentLoadedCount >= this.filteredData.length) {
            this.loadMoreBtn.style.display = 'none';
        } else {
            this.loadMoreBtn.style.display = 'block';
            this.loadMoreBtn.textContent = 'Load More';
        }
    },

    updateEmptyState() {
        const grid = document.querySelector(CONFIG.galleryGridSelector);
        let emptyMsg = document.querySelector('.gallery-empty-message');

        if (this.filteredData.length === 0) {
            grid.style.display = 'none';
            if (!emptyMsg) {
                emptyMsg = document.createElement('div');
                emptyMsg.className = 'gallery-empty-message';
                emptyMsg.textContent = 'No photos found in this category.';
                emptyMsg.style.textAlign = 'center';
                emptyMsg.style.padding = '50px';
                emptyMsg.style.color = '#666';
                grid.parentNode.insertBefore(emptyMsg, grid.nextSibling);
            } else {
                emptyMsg.style.display = 'block';
            }
            if (this.loadMoreBtn) this.loadMoreBtn.style.display = 'none';
        } else {
            grid.style.display = 'grid';
            if (emptyMsg) emptyMsg.style.display = 'none';
        }
    },

    shuffleArray(array) {
        for (let i = array.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [array[i], array[j]] = [array[j], array[i]];
        }
    },

    createGalleryItem(data, index) {
        const div = document.createElement('div');
        div.className = 'gallery-item';

        // Wide layout for landscape images
        if (data.width && data.height && data.width / data.height >= 1.2) {
            div.classList.add('wide');
        }

        div.dataset.index = index;

        // Fade in animation
        div.style.animation = 'fadeIn 0.5s ease forwards';

        // Click to Open Modal
        div.addEventListener('click', () => Modal.open(index));

        // Create Image
        const img = document.createElement('img');
        img.src = `images/gallery/${data.filePath}`;
        img.alt = `Photo from ${(data.country || 'unknown')}`;
        img.loading = 'lazy';
        img.onerror = () => { img.src = CONFIG.placeholderImage; };
        img.onload = () => this.resizeGalleryItem(div);

        // Create Overlay
        const overlay = document.createElement('div');
        overlay.className = 'gallery-overlay';

        const h4 = document.createElement('h4');
        const p = document.createElement('p');

        const info = formatPhotoInfo(data);
        h4.textContent = info.techLine;
        p.textContent = info.contextLine;

        overlay.appendChild(h4);
        overlay.appendChild(p);
        div.appendChild(img);
        div.appendChild(overlay);

        return div;
    },

    resizeGalleryItem(item) {
        const grid = document.querySelector(CONFIG.galleryGridSelector);
        if (!grid) return;

        const rowHeight = CONFIG.rowHeight;
        const rowGap = parseInt(window.getComputedStyle(grid).getPropertyValue('row-gap')) || CONFIG.rowGap;
        const img = item.querySelector('img');
        if (!img) return;

        const contentHeight = img.getBoundingClientRect().height;
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
    currentFilterValue: 'all',
    filterTabs: null,
    filterGroups: null,

    init() {
        this.filterTabs = document.querySelectorAll('.filter-tab');
        this.filterGroups = {
            country: document.getElementById('filter-country'),
            year: document.getElementById('filter-year')
        };

        if (!this.filterTabs.length) return;

        this.bindEvents();

        // Initial render with "All"
        GalleryBuilder.renderFiltered(this.currentFilterType, 'all');
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

        // Update tab UI
        this.filterTabs.forEach(t => t.classList.remove('active'));
        tab.classList.add('active');

        // Show/hide filter groups
        Object.entries(this.filterGroups).forEach(([type, group]) => {
            if (!group) return;
            group.style.display = type === filterType ? 'flex' : 'none';
        });

        // Reset to "All" for new filter type
        this.currentFilterType = filterType;
        this.currentFilterValue = 'all';

        const activeGroup = this.filterGroups[filterType];
        if (activeGroup) {
            activeGroup.querySelectorAll('.filter-btn').forEach(btn => {
                btn.classList.toggle('active', btn.dataset.filter === 'all');
            });
        }

        // Re-render with new filter type
        GalleryBuilder.renderFiltered(filterType, 'all');
    },

    applyFilter(btn, group) {
        // Update button UI
        group.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');

        const filterValue = btn.dataset.filter;
        this.currentFilterValue = filterValue;

        // Re-render gallery with filter
        GalleryBuilder.renderFiltered(this.currentFilterType, filterValue);
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

        this.closeBtn.onclick = () => this.close();
        this.prevBtn.onclick = (e) => { e.stopPropagation(); this.prev(); };
        this.nextBtn.onclick = (e) => { e.stopPropagation(); this.next(); };

        this.modal.onclick = (e) => {
            if (e.target === this.modal) this.close();
        };

        document.addEventListener('keydown', (e) => {
            if (!this.modal.classList.contains('active')) return;
            if (e.key === 'Escape') this.close();
            if (e.key === 'ArrowLeft') this.prev();
            if (e.key === 'ArrowRight') this.next();
        });
    },

    open(index) {
        if (index < 0 || index >= GalleryBuilder.filteredData.length) return;
        this.currentIndex = index;
        this.updateModalContent();
        this.modal.classList.add('active');
        document.body.style.overflow = 'hidden';
    },

    close() {
        this.modal.classList.remove('active');
        document.body.style.overflow = '';
    },

    prev() {
        // Navigate within filtered data
        this.currentIndex = (this.currentIndex - 1 + GalleryBuilder.filteredData.length) % GalleryBuilder.filteredData.length;
        this.updateModalContent();
    },

    next() {
        // Navigate within filtered data
        this.currentIndex = (this.currentIndex + 1) % GalleryBuilder.filteredData.length;
        this.updateModalContent();
    },

    updateModalContent() {
        const data = GalleryBuilder.filteredData[this.currentIndex];
        this.img.src = `images/gallery/${data.filePath}`;

        const info = formatPhotoInfo(data);
        this.caption.textContent = `${info.techLine} | ${info.contextLine}`;
    }
};
