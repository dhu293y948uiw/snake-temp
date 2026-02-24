// js/cart.js
// Handles all cart logic - add, remove, update quantity, sync to Firebase

import { auth, db } from "./firebase.js";
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";
import { doc, getDoc, setDoc, updateDoc } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

// In-memory cart (also synced to Firebase if logged in)
let cart = [];
let currentUser = null;

// Promise that resolves when cart is fully loaded
let cartReadyResolve;
export const cartReady = new Promise(resolve => { cartReadyResolve = resolve; });

// Listen for auth state - load cart from Firebase when logged in
onAuthStateChanged(auth, async (user) => {
    currentUser = user;
    if (user) {
        await loadCartFromFirebase(user.uid);
    } else {
        // Load from localStorage for guests
        const saved = localStorage.getItem('snake-cart');
        cart = saved ? JSON.parse(saved) : [];
    }
    updateCartIcon();
    cartReadyResolve(); // Signal that cart is ready
});

// ---- Load / Save ----

async function loadCartFromFirebase(uid) {
    const userDoc = await getDoc(doc(db, 'users', uid));
    if (userDoc.exists()) {
        cart = userDoc.data().cart || [];
    }
    updateCartIcon();
}

async function saveCart() {
    if (currentUser) {
        await updateDoc(doc(db, 'users', currentUser.uid), { cart });
    } else {
        localStorage.setItem('snake-cart', JSON.stringify(cart));
    }
    updateCartIcon();
}

// ---- Cart Operations ----

export async function addToCart(product, variantId, variantLabel, quantity = 1) {
    const existingIndex = cart.findIndex(
        item => item.productId === product.id && item.variantId === variantId
    );

    if (existingIndex > -1) {
        cart[existingIndex].quantity += quantity;
    } else {
        cart.push({
            productId: product.id,
            title: product.title,
            variantId,
            variantLabel,
            price: product.price,
            image: product.images[0] || '',
            quantity
        });
    }

    await saveCart();
    showCartNotification(product.title);
}

export async function removeFromCart(productId, variantId) {
    cart = cart.filter(item => !(item.productId === productId && item.variantId === variantId));
    await saveCart();
}

export async function updateQuantity(productId, variantId, quantity) {
    if (quantity <= 0) {
        await removeFromCart(productId, variantId);
        return;
    }
    const item = cart.find(item => item.productId === productId && item.variantId === variantId);
    if (item) {
        item.quantity = quantity;
        await saveCart();
    }
}

export function getCart() {
    return cart;
}

export function getCartTotal() {
    return cart.reduce((total, item) => {
        const price = parseFloat(item.price.replace('$', '')) || 0;
        return total + price * item.quantity;
    }, 0).toFixed(2);
}

export function getCartCount() {
    return cart.reduce((count, item) => count + item.quantity, 0);
}

// ---- UI Helpers ----

function updateCartIcon() {
    const badge = document.getElementById('cart-count');
    if (badge) {
        const count = getCartCount();
        badge.textContent = count;
        badge.style.display = count > 0 ? 'inline-block' : 'none';
    }
}

function showCartNotification(title) {
    let notif = document.getElementById('cart-notif');
    if (!notif) {
        notif = document.createElement('div');
        notif.id = 'cart-notif';
        document.body.appendChild(notif);
    }
    notif.textContent = `✓ ${title} added to cart`;
    notif.classList.add('show');
    setTimeout(() => notif.classList.remove('show'), 2500);
}

export async function clearCart() {
    cart = [];
    await saveCart();
    updateCartIcon();
}
