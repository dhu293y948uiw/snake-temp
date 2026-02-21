// js/products.js
// Fetches products from your Vercel serverless function and renders dynamic product cards.
// Used by index.html, shop.html, and collections.html

/**
 * Build a single product card element
 */
function buildProductCard(product) {
    const card = document.createElement('div');
    card.className = 'product-card';

    // --- Carousel ---
    const carousel = document.createElement('div');
    carousel.className = 'carousel';

    const images = product.images.length > 0
        ? product.images
        : ['https://via.placeholder.com/250x250?text=No+Image'];

    images.forEach((src, i) => {
        const img = document.createElement('img');
        img.src = src;
        img.alt = product.title;
        if (i === 0) img.classList.add('active');
        carousel.appendChild(img);
    });

    if (images.length > 1) {
        const prev = document.createElement('button');
        prev.className = 'carousel-btn prev';
        prev.textContent = '←';
        carousel.appendChild(prev);

        const next = document.createElement('button');
        next.className = 'carousel-btn next';
        next.textContent = '→';
        carousel.appendChild(next);

        // Carousel logic
        let currentIndex = 0;
        const imgs = carousel.querySelectorAll('img');
        const show = (idx) => imgs.forEach((img, i) => img.classList.toggle('active', i === idx));

        prev.addEventListener('click', () => {
            currentIndex = (currentIndex - 1 + imgs.length) % imgs.length;
            show(currentIndex);
        });
        next.addEventListener('click', () => {
            currentIndex = (currentIndex + 1) % imgs.length;
            show(currentIndex);
        });
    }

    card.appendChild(carousel);

    // --- Info ---
    const title = document.createElement('h3');
    title.textContent = product.title;
    card.appendChild(title);

    // Short description (first sentence or first 80 chars)
    if (product.description) {
        const desc = document.createElement('p');
        const raw = product.description.replace(/<[^>]+>/g, ''); // strip HTML tags
        desc.textContent = raw.length > 80 ? raw.substring(0, 80) + '…' : raw;
        card.appendChild(desc);
    }

    const price = document.createElement('p');
    price.className = 'price';
    price.textContent = product.price;
    card.appendChild(price);

    // Buy button — links to shop page filtered by product
    const btn = document.createElement('a');
    btn.className = 'buy-btn';
    btn.href = product.url;
    btn.textContent = 'View Product';
    card.appendChild(btn);

    return card;
}

/**
 * Fetch all products from the Vercel API proxy
 */
async function fetchProducts() {
    const response = await fetch('/api/products');
    if (!response.ok) throw new Error(`API error: ${response.status}`);
    const data = await response.json();
    return data.products || [];
}

/**
 * Load products into a grid container
 * @param {string} containerId - ID of the .product-grid element
 * @param {number|null} limit - Max number of products to show (null = all)
 */
async function loadProducts(containerId, limit = null) {
    const grid = document.getElementById(containerId);
    if (!grid) return;

    try {
        const products = await fetchProducts();
        grid.innerHTML = '';

        const toShow = limit ? products.slice(0, limit) : products;

        if (toShow.length === 0) {
            grid.innerHTML = '<p class="loading-state">No products found.</p>';
            return;
        }

        toShow.forEach(p => grid.appendChild(buildProductCard(p)));

    } catch (err) {
        console.error(err);
        grid.innerHTML = `<p class="error-state">Could not load products. Please try again later.</p>`;
    }
}

/**
 * Load products grouped by collection tags into a container
 * Products should be tagged in Printify as "collection:Collection Name"
 * @param {string} containerId - ID of the container element
 */
async function loadCollections(containerId) {
    const container = document.getElementById(containerId);
    if (!container) return;

    try {
        const products = await fetchProducts();
        container.innerHTML = '';

        // Group by collection tag
        const groups = {};
        const uncategorized = [];

        products.forEach(p => {
            if (p.collections.length > 0) {
                p.collections.forEach(col => {
                    if (!groups[col]) groups[col] = [];
                    groups[col].push(p);
                });
            } else {
                uncategorized.push(p);
            }
        });

        if (uncategorized.length > 0) {
            groups['All Products'] = uncategorized;
        }

        if (Object.keys(groups).length === 0) {
            container.innerHTML = '<p class="loading-state">No collections found.</p>';
            return;
        }

        Object.entries(groups).forEach(([collectionName, items]) => {
            const section = document.createElement('div');
            section.className = 'collection';

            const heading = document.createElement('h2');
            heading.textContent = collectionName;
            section.appendChild(heading);

            const grid = document.createElement('div');
            grid.className = 'product-grid';
            items.forEach(p => grid.appendChild(buildProductCard(p)));
            section.appendChild(grid);

            container.appendChild(section);
        });

    } catch (err) {
        console.error(err);
        container.innerHTML = `<p class="error-state">Could not load collections. Please try again later.</p>`;
    }
}
