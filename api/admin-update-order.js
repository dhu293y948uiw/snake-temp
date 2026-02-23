// api/admin-update-order.js
// Updates a user's order status - admin only

const { initializeApp, cert, getApps } = require('firebase-admin/app');
const { getFirestore } = require('firebase-admin/firestore');
const { getAuth } = require('firebase-admin/auth');

function initAdmin() {
    if (getApps().length === 0) {
        initializeApp({
            credential: cert({
                projectId: process.env.FIREBASE_PROJECT_ID,
                clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
                privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
            }),
        });
    }
}

module.exports = async function handler(req, res) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Authorization, Content-Type');
    if (req.method === 'OPTIONS') return res.status(200).end();
    if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

    const token = req.headers.authorization?.split('Bearer ')[1];
    if (!token) return res.status(401).json({ error: 'Unauthorized' });

    try {
        initAdmin();
        const auth = getAuth();
        const db = getFirestore();

        const decoded = await auth.verifyIdToken(token);
        const adminDoc = await db.collection('users').doc(decoded.uid).get();
        if (!adminDoc.exists || !adminDoc.data().isAdmin) {
            return res.status(403).json({ error: 'Forbidden - not an admin' });
        }

        const { userId, orderId, status } = req.body;
        if (!userId || !orderId || !status) {
            return res.status(400).json({ error: 'Missing userId, orderId or status' });
        }

        const userRef = db.collection('users').doc(userId);
        const userDoc = await userRef.get();
        if (!userDoc.exists) return res.status(404).json({ error: 'User not found' });

        const orders = userDoc.data().orders || [];
        const updatedOrders = orders.map(order =>
            order.id === orderId ? { ...order, status } : order
        );

        await userRef.update({ orders: updatedOrders });
        return res.status(200).json({ success: true });

    } catch (err) {
        console.error('Update order error:', err);
        return res.status(500).json({ error: err.message });
    }
};
