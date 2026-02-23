// api/admin-delete-user.js
// Bans or deletes a user - admin only

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

        const { userId, action } = req.body; // action: 'ban' or 'delete'
        if (!userId || !action) return res.status(400).json({ error: 'Missing userId or action' });

        if (action === 'ban') {
            // Disable the Firebase Auth account
            await auth.updateUser(userId, { disabled: true });
            // Mark as banned in Firestore
            await db.collection('users').doc(userId).update({ banned: true });
            return res.status(200).json({ success: true, message: 'User banned' });
        }

        if (action === 'unban') {
            await auth.updateUser(userId, { disabled: false });
            await db.collection('users').doc(userId).update({ banned: false });
            return res.status(200).json({ success: true, message: 'User unbanned' });
        }

        if (action === 'delete') {
            // Delete from Firebase Auth and Firestore
            await auth.deleteUser(userId);
            await db.collection('users').doc(userId).delete();
            return res.status(200).json({ success: true, message: 'User deleted' });
        }

        return res.status(400).json({ error: 'Invalid action' });

    } catch (err) {
        console.error('Delete user error:', err);
        return res.status(500).json({ error: err.message });
    }
};
