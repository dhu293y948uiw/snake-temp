// js/products.js
// Fetches products from /api/products and renders dynamic product cards.

async function fetchProducts() {
    const response = await fetch('/api/products');
    if (!response.ok) throw new Error(`API error: ${response.status}`);
    const data = await response.json();
    return data.products || [];
}

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
        img.style.cursor = 'pointer';
        img.addEventListener('click', () => { window.location.href = './product.html?id=' + product.id; });
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
    const titleLink = document.createElement('a');
    titleLink.href = './product.html?id=' + product.id;
    titleLink.textContent = product.title;
    titleLink.style.color = '#fff';
    titleLink.style.textDecoration = 'none';
    title.appendChild(titleLink);
    card.appendChild(title);

    if (product.description) {
        const desc = document.createElement('p');
        const raw = product.description.replace(/<[^>]+>/g, '');
        desc.textContent = raw.length > 80 ? raw.substring(0, 80) + '...' : raw;
        card.appendChild(desc);
    }

    const price = document.createElement('p');
    price.className = 'price';
    price.textContent = product.price;
    card.appendChild(price);

    // --- Variant selector (sizes) ---
    if (product.variants && product.variants.length > 0) {
        const variantSelect = document.createElement('select');
        variantSelect.className = 'variant-select';
        product.variants.forEach(v => {
            const option = document.createElement('option');
            option.value = v.id;
            option.textContent = v.label;
            variantSelect.appendChild(option);
        });
        card.appendChild(variantSelect);

        const addBtn = document.createElement('button');
        addBtn.className = 'buy-btn add-to-cart-btn';
        addBtn.textContent = 'Add to Cart';
        addBtn.addEventListener('click', async () => {
            const selectedVariant = product.variants.find(v => v.id == variantSelect.value);
            const { addToCart } = await import('./cart.js');
            await addToCart(product, selectedVariant.id, selectedVariant.label);
        });
        card.appendChild(addBtn);
    } else {
        const btn = document.createElement('a');
        btn.className = 'buy-btn';
        btn.href = './product.html?id=' + product.id;
        btn.textContent = 'View Product';
        card.appendChild(btn);
    }

    return card;
}

async function loadProducts(containerId, limit) {
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
        grid.innerHTML = '<p class="error-state">Could not load products. Please try again later.</p>';
    }
}

async function loadCollections(containerId) {
    const container = document.getElementById(containerId);
    if (!container) return;

    try {
        const products = await fetchProducts();
        container.innerHTML = '';

        const groups = {};
        const uncategorized = [];

        products.forEach(p => {
            if (p.collections && p.collections.length > 0) {
                p.collections.forEach(col => {
                    if (!groups[col]) groups[col] = [];
                    groups[col].push(p);
                });
            } else {
                uncategorized.push(p);
            }
        });

        if (uncategorized.length > 0) groups['All Products'] = uncategorized;

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
        container.innerHTML = '<p class="error-state">Could not load collections. Please try again later.</p>';
    }
}
