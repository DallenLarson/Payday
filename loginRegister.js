import { auth } from "./firebaseConfig.js";
import { 
    createUserWithEmailAndPassword, 
    signInWithEmailAndPassword 
} from "https://www.gstatic.com/firebasejs/9.15.0/firebase-auth.js";

// DOM elements
const formTitle = document.getElementById("formTitle");
const authForm = document.getElementById("authForm");
const toggleMessage = document.getElementById("toggleMessage");
const submitButton = document.getElementById("submitButton");
const errorMessage = document.getElementById("errorMessage"); // Error message element

// Track the current form mode (login/register)
let isLoginMode = true;

// Toggle between login and registration mode
toggleMessage.addEventListener("click", (event) => {
    event.preventDefault();
    isLoginMode = !isLoginMode;

    // Update the form title and button text
    formTitle.textContent = isLoginMode ? "Login" : "Register";
    submitButton.textContent = isLoginMode ? "Login" : "Register";
    toggleMessage.innerHTML = isLoginMode
        ? "Don't have an account? <a href='#' id='toggleFormLink'>Register here</a>"
        : "Already have an account? <a href='#' id='toggleFormLink'>Login here</a>";

    // Hide any previous error message
    errorMessage.style.display = "none";
    errorMessage.textContent = "";
});

// Handle the form submission
authForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    const email = document.getElementById("email").value;
    const password = document.getElementById("password").value;

    try {
        if (isLoginMode) {
            // Login
            await signInWithEmailAndPassword(auth, email, password);
            window.location.href = "index.html";
        } else {
            // Register
            await createUserWithEmailAndPassword(auth, email, password);
            window.location.href = "index.html";
        }
        authForm.reset();
    } catch (error) {
        // Display Firebase error message in red text
        errorMessage.textContent = error.message || "An error occurred. Please try again.";
        errorMessage.style.display = "block";
        console.error("Authentication error:", error);
    }
});
