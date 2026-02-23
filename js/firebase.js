import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

const firebaseConfig = {
    apiKey: "AIzaSyDK3Z_J1bVaZMemhYelvZ-2HLAn_6FkqFg",
    authDomain: "snake-acc-auth.firebaseapp.com",
    projectId: "snake-acc-auth",
    storageBucket: "snake-acc-auth.firebasestorage.app",
    messagingSenderId: "894341847883",
    appId: "1:894341847883:web:64c04c58f02198f674a6ce"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
