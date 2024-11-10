import { auth } from "./firebaseConfig.js";
import { onAuthStateChanged, signOut as firebaseSignOut } from "https://www.gstatic.com/firebasejs/9.15.0/firebase-auth.js";

// DOM Elements
const logoutButton = document.getElementById('logoutButton');
const scanButton = document.querySelector('.scan-section button');
const portfolioButton = document.querySelector('.portfolio-section button');

// Check Firebase authentication state
onAuthStateChanged(auth, (user) => {
    if (user) {
        // User is signed in, display the logout button
        logoutButton.style.display = 'inline-block';
    } else {
        // No user is signed in, redirect to login page
        window.location.href = "login.html";
    }
});

// Handle logout
logoutButton.addEventListener('click', async () => {
    await firebaseSignOut(auth);
    window.location.href = "login.html"; // Redirect to login after logging out
});

// Redirects to scanning page
scanButton.onclick = () => {
    window.location.href = 'scanner.html';
};

// Redirects to portfolio page
portfolioButton.onclick = () => {
    window.location.href = 'portfolio.html';
};
