export default async function handler(req, res) {
  const token = process.env.PRINTIFY_TOKEN;
  const shopId = process.env.PRINTIFY_SHOP_ID;

  if (!token || !shopId) {
    return res.status(500).json({ error: "Missing Printify credentials" });
  }

  try {
    const response = await fetch(
      `https://api.printify.com/v1/shops/${shopId}/products.json?limit=50`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          "User-Agent": "SnakeStore/1.0",
        },
      }
    );

    if (!response.ok) throw new Error("Printify API error");

    const data = await response.json();
    res.status(200).json(data.data || data);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to fetch products" });
  }
}
