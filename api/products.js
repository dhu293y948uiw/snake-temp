export default async function handler(req, res) {
  const token = process.env.PRINTIFY_TOKEN;
  const shopId = process.env.PRINTIFY_SHOP_ID;

  if (!token || !shopId) {
    return res.status(500).json({ error: 'Missing Printify credentials in Vercel env vars' });
  }

  try {
    const url = `https://api.printify.com/v1/shops/${shopId}/products.json?limit=50`;
    
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'User-Agent': 'SnakeStore/1.0',
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Printify error: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    res.status(200).json(data.data || data);  // .data is common in paginated responses
  } catch (error) {
    console.error('Products fetch failed:', error);
    res.status(500).json({ error: 'Failed to load products from Printify' });
  }
}
