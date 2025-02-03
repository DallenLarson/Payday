import { auth } from "./firebaseConfig.js"; // Import the existing `auth` from firebaseConfig.js
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/9.16.0/firebase-auth.js";

// Check Auth State
onAuthStateChanged(auth, (user) => {
  if (user) {
    // User is signed in, redirect to the home page
    console.log("User is signed in:", user);
    if (!window.location.pathname.includes("/home")) {
      window.location.href = "/home";
    }
  } else {
    // No user is signed in, redirect to the login page
    console.log("No user is signed in.");
    if (!window.location.pathname.includes("/login")) {
      window.location.href = "/login";
    }
  }
});
