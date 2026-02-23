// api/admin-users.js
// Returns all users from Firestore - admin only, verified server-side via Firebase Admin SDK

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
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Authorization, Content-Type');
    if (req.method === 'OPTIONS') return res.status(200).end();

    // Verify Firebase ID token from Authorization header
    const token = req.headers.authorization?.split('Bearer ')[1];
    if (!token) return res.status(401).json({ error: 'Unauthorized' });

    try {
        initAdmin();
        const auth = getAuth();
        const db = getFirestore();

        // Verify token and check admin status
        const decoded = await auth.verifyIdToken(token);
        const userDoc = await db.collection('users').doc(decoded.uid).get();
        if (!userDoc.exists || !userDoc.data().isAdmin) {
            return res.status(403).json({ error: 'Forbidden - not an admin' });
        }

        // Fetch all users
        const snapshot = await db.collection('users').get();
        const users = snapshot.docs.map(doc => ({
            uid: doc.id,
            ...doc.data(),
            createdAt: doc.data().createdAt?.toDate?.()?.toISOString() || null,
        }));

        return res.status(200).json({ users });

    } catch (err) {
        console.error('Admin users error:', err);
        return res.status(500).json({ error: err.message });
    }
};
