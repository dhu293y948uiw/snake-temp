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
onAuthStateChanged(auth, (user) => {
    updateNav(user);
});

function updateNav(user) {
    const navAuth = document.getElementById('nav-auth');
    if (!navAuth) return;

    if (user) {
        navAuth.innerHTML = `
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

    // Inject modal styles
    if (!document.getElementById('auth-modal-styles')) {
        const style = document.createElement('style');
        style.id = 'auth-modal-styles';
        style.textContent = `
            #auth-modal {
                position: fixed;
                inset: 0;
                z-index: 1000;
                display: flex;
                align-items: center;
                justify-content: center;
            }
            .auth-modal-overlay {
                position: absolute;
                inset: 0;
                background: rgba(0,0,0,0.8);
            }
            .auth-modal-box {
                position: relative;
                background: #111;
                border: 1px solid #333;
                padding: 40px;
                width: 100%;
                max-width: 400px;
                border-radius: 8px;
                z-index: 1;
            }
            .auth-modal-close {
                position: absolute;
                top: 15px;
                right: 15px;
                background: none;
                border: none;
                color: #fff;
                font-size: 1.5em;
                cursor: pointer;
            }
            .auth-tabs {
                display: flex;
                margin-bottom: 25px;
                border-bottom: 1px solid #333;
            }
            .auth-tab {
                background: none;
                border: none;
                color: #aaa;
                font-size: 1em;
                padding: 10px 20px;
                cursor: pointer;
                text-transform: uppercase;
                letter-spacing: 1px;
                font-weight: bold;
            }
            .auth-tab.active {
                color: #fff;
                border-bottom: 2px solid #fff;
            }
            #auth-form input {
                display: block;
                width: 100%;
                background: #222;
                border: 1px solid #444;
                color: #fff;
                padding: 12px;
                margin-bottom: 15px;
                border-radius: 4px;
                font-size: 1em;
            }
            #auth-form input:focus {
                outline: none;
                border-color: #888;
            }
            #auth-submit {
                width: 100%;
                padding: 12px;
                background: #fff;
                color: #000;
                border: none;
                border-radius: 4px;
                font-size: 1em;
                font-weight: bold;
                text-transform: uppercase;
                cursor: pointer;
                transition: background 0.3s;
            }
            #auth-submit:hover { background: #ccc; }
            #auth-error {
                color: #e55;
                font-size: 0.9em;
                margin-bottom: 10px;
                min-height: 20px;
            }
        `;
        document.head.appendChild(style);
    }

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
