// js/auth.js
// Handles all authentication logic - login, signup, logout, auth state

import { auth, db } from "./firebase.js";
import {
    createUserWithEmailAndPassword,
    signInWithEmailAndPassword,
    signOut,
    onAuthStateChanged,
    updateProfile
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";
import {
    doc,
    setDoc,
    getDoc,
    serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

// ---- Auth State ----
// Runs on every page - updates nav to show login or account link
onAuthStateChanged(auth, async (user) => {
    await updateNav(user);
});

async function updateNav(user) {
    const navAuth = document.getElementById('nav-auth');
    if (!navAuth) return;

    if (user) {
        // Check if admin
        const userDoc = await getDoc(doc(db, 'users', user.uid));
        const isAdmin = userDoc.exists() && userDoc.data().isAdmin;

        navAuth.innerHTML = `
            ${isAdmin ? '<a href="./admin.html" class="admin-nav-link">Admin Panel</a>' : ''}
            <a href="./account.html">${user.displayName || 'Account'}</a>
            <a href="#" id="logout-btn">Logout</a>
        `;
        document.getElementById('logout-btn').addEventListener('click', (e) => {
            e.preventDefault();
            logout();
        });
    } else {
        navAuth.innerHTML = `<a href="#" id="open-auth-modal">Login / Sign Up</a>`;
        document.getElementById('open-auth-modal').addEventListener('click', (e) => {
            e.preventDefault();
            openModal();
        });
    }
}

// ---- Modal ----
export function openModal(mode = 'login') {
    let modal = document.getElementById('auth-modal');
    if (!modal) {
        modal = buildModal();
        document.body.appendChild(modal);
    }
    modal.style.display = 'flex';
    switchMode(mode);
}

function closeModal() {
    const modal = document.getElementById('auth-modal');
    if (modal) modal.style.display = 'none';
}

function buildModal() {
    const modal = document.createElement('div');
    modal.id = 'auth-modal';
    modal.innerHTML = `
        <div class="auth-modal-overlay"></div>
        <div class="auth-modal-box">
            <button class="auth-modal-close">&times;</button>
            <div class="auth-tabs">
                <button class="auth-tab active" data-mode="login">Login</button>
                <button class="auth-tab" data-mode="signup">Sign Up</button>
            </div>
            <form id="auth-form">
                <div id="name-field" style="display:none;">
                    <input type="text" id="auth-name" placeholder="Full Name" />
                </div>
                <input type="email" id="auth-email" placeholder="Email" required />
                <input type="password" id="auth-password" placeholder="Password" required />
                <p id="auth-error"></p>
                <button type="submit" id="auth-submit">Login</button>
            </form>
        </div>
    `;

    // Close on overlay click
    modal.querySelector('.auth-modal-overlay').addEventListener('click', closeModal);
    modal.querySelector('.auth-modal-close').addEventListener('click', closeModal);

    // Tab switching
    modal.querySelectorAll('.auth-tab').forEach(tab => {
        tab.addEventListener('click', () => switchMode(tab.dataset.mode));
    });

    // Form submit
    modal.querySelector('#auth-form').addEventListener('submit', handleSubmit);

    return modal;
}

let currentMode = 'login';

function switchMode(mode) {
    currentMode = mode;
    const nameField = document.getElementById('name-field');
    const submitBtn = document.getElementById('auth-submit');
    const tabs = document.querySelectorAll('.auth-tab');

    tabs.forEach(t => t.classList.toggle('active', t.dataset.mode === mode));

    if (mode === 'signup') {
        nameField.style.display = 'block';
        submitBtn.textContent = 'Create Account';
    } else {
        nameField.style.display = 'none';
        submitBtn.textContent = 'Login';
    }
    document.getElementById('auth-error').textContent = '';
}

async function handleSubmit(e) {
    e.preventDefault();
    const email = document.getElementById('auth-email').value.trim();
    const password = document.getElementById('auth-password').value;
    const errorEl = document.getElementById('auth-error');
    errorEl.textContent = '';

    try {
        if (currentMode === 'signup') {
            const name = document.getElementById('auth-name').value.trim();
            if (!name) { errorEl.textContent = 'Please enter your name.'; return; }

            const userCred = await createUserWithEmailAndPassword(auth, email, password);
            await updateProfile(userCred.user, { displayName: name });

            // Create user document in Firestore
            await setDoc(doc(db, 'users', userCred.user.uid), {
                name,
                email,
                createdAt: serverTimestamp(),
                orders: []
            });

            closeModal();
            window.location.href = './account.html';

        } else {
            await signInWithEmailAndPassword(auth, email, password);
            closeModal();
        }
    } catch (err) {
        errorEl.textContent = friendlyError(err.code);
    }
}

function friendlyError(code) {
    switch (code) {
        case 'auth/email-already-in-use': return 'An account with this email already exists.';
        case 'auth/invalid-email': return 'Invalid email address.';
        case 'auth/weak-password': return 'Password must be at least 6 characters.';
        case 'auth/user-not-found':
        case 'auth/wrong-password':
        case 'auth/invalid-credential': return 'Incorrect email or password.';
        default: return 'Something went wrong. Please try again.';
    }
}

async function logout() {
    await signOut(auth);
    window.location.href = './index.html';
}
