// api/products.js
// Vercel serverless function - proxies Printify API so your key stays secret.

module.exports = async function handler(req, res) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET');

    const { PRINTIFY_API_KEY, PRINTIFY_SHOP_ID } = process.env;

    if (!PRINTIFY_API_KEY || !PRINTIFY_SHOP_ID) {
        return res.status(500).json({ error: 'Printify credentials not configured.' });
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

        const products = (data.data || []).map(p => {
            const price = p.variants?.[0]?.price
                ? `$${(p.variants[0].price / 100).toFixed(2)}`
                : 'See options';

            const images = (p.images || [])
                .filter(img => img.src)
                .slice(0, 6)
                .map(img => img.src);

            const collectionTags = (p.tags || [])
                .filter(t => t.toLowerCase().startsWith('collection:'))
                .map(t => t.substring('collection:'.length).trim());

            const variants = (p.variants || [])
                .filter(v => v.is_enabled)
                .map(v => ({
                    id: v.id,
                    label: v.title || `Variant ${v.id}`,
                    price: v.price ? `$${(v.price / 100).toFixed(2)}` : price
                }));

            return {
                id: p.id,
                title: p.title,
                description: p.description || '',
                price,
                images,
                variants,
                tags: p.tags || [],
                collections: collectionTags,
                url: `/shop.html?product=${p.id}`,
            };
        });

        return res.status(200).json({ products });

    } catch (err) {
        console.error('Printify API error:', err);
        return res.status(500).json({ error: err.message });
    }
}
