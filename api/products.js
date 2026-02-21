// api/products.js
// Vercel serverless function - proxies Printify API so your key stays secret.
// Deploy this file to your repo at /api/products.js
// Set PRINTIFY_API_KEY and PRINTIFY_SHOP_ID in Vercel Environment Variables.

module.exports = async function handler(req, res) {
    // Allow your frontend to call this
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET');

    const { PRINTIFY_API_KEY, PRINTIFY_SHOP_ID } = process.env;

    if (!PRINTIFY_API_KEY || !PRINTIFY_SHOP_ID) {
        return res.status(500).json({ error: 'Printify credentials not configured. Set PRINTIFY_API_KEY and PRINTIFY_SHOP_ID in Vercel Environment Variables.' });
    }

    try {
        const response = await fetch(
            `https://api.printify.com/v1/shops/${PRINTIFY_SHOP_ID}/products.json?limit=50`,
            {
                headers: {
                    'Authorization': `Bearer ${PRINTIFY_API_KEY}`,
                    'Content-Type': 'application/json',
                }
            }
        );

        if (!response.ok) {
            const error = await response.text();
            return res.status(response.status).json({ error });
        }

        const data = await response.json();

        // Transform into a clean, frontend-friendly shape
        const products = (data.data || [])
            .filter(p => p.visible) // only published products
            .map(p => {
                // Get first variant price (in cents → dollars)
                const price = p.variants?.[0]?.price
                    ? `$${(p.variants[0].price / 100).toFixed(2)}`
                    : 'See options';

                // Get all unique image URLs (up to 6)
                const images = (p.images || [])
                    .filter(img => img.src)
                    .slice(0, 6)
                    .map(img => img.src);

                // Parse collection tags (format: "collection:Name")
                const collectionTags = (p.tags || [])
                    .filter(t => t.toLowerCase().startsWith('collection:'))
                    .map(t => t.substring('collection:'.length).trim());

                return {
                    id: p.id,
                    title: p.title,
                    description: p.description || '',
                    price,
                    images,
                    tags: p.tags || [],
                    collections: collectionTags,
                    // Printify doesn't have a direct buy URL — link to your shop page
                    url: `/shop.html?product=${p.id}`,
                };
            });

        return res.status(200).json({ products });

    } catch (err) {
        console.error('Printify API error:', err);
        return res.status(500).json({ error: 'Failed to fetch products from Printify.' });
    }
}
