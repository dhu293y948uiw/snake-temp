// api/products.js - assuming it already fetches Printify data
// Add or modify the rendering part like this:

document.addEventListener('DOMContentLoaded', function() {
  const container = document.getElementById('products-container');
  if (!container) return;

  // If your file already has a fetch call, put the rendering inside the .then()
  // Example structure (merge with your existing code):

  fetch('https://api.printify.com/v1/shops/YOUR_SHOP_ID/products.json', {  // replace with your actual endpoint if different
    headers: {
      'Authorization': 'Bearer YOUR_TOKEN_HERE'  // if hardcoded (not recommended long-term)
    }
  })
  .then(response => response.json())
  .then(data => {
    container.innerHTML = ''; // clear loading

    (data.data || []).forEach(product => {
      const card = document.createElement('div');
      card.className = 'product-card';
      const imgSrc = product.images?.[0]?.src || 'https://via.placeholder.com/400x500/111/000?text=Product';
      const price = product.variants?.[0]?.price ? `$${(product.variants[0].price / 100).toFixed(2)}` : 'N/A';

      card.innerHTML = `
        <img src="${imgSrc}" alt="${product.title || 'Product'}" class="product-image">
        <h3>${product.title || 'Unnamed'}</h3>
        <p class="price">${price}</p>
        <a href="#" class="shop-now-btn">Shop Now</a>
      `;
      container.appendChild(card);
    });

    if (!data.data || data.data.length === 0) {
      container.innerHTML = '<p>No products available right now.</p>';
    }
  })
  .catch(err => {
    container.innerHTML = '<p>Error loading products — check console.</p>';
    console.error('Printify fetch error:', err);
  });
});
