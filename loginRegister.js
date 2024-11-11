import { auth } from "./firebaseConfig.js";
import { createUserWithEmailAndPassword, signInWithEmailAndPassword } from "https://www.gstatic.com/firebasejs/9.15.0/firebase-auth.js";
import { getFirestore, doc, setDoc, getDocs, collection, query, where } from "https://www.gstatic.com/firebasejs/9.15.0/firebase-firestore.js";

// Firestore database
const db = getFirestore();

// DOM elements
const formTitle = document.getElementById("formTitle");
const authForm = document.getElementById("authForm");
const toggleMessage = document.getElementById("toggleMessage");
const submitButton = document.getElementById("submitButton");
const errorMessage = document.getElementById("errorMessage");
const usernameLabel = document.getElementById("usernameLabel");
const usernameField = document.getElementById("username");

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

    // Toggle username field visibility
    usernameLabel.style.display = isLoginMode ? "none" : "block";
    usernameField.style.display = isLoginMode ? "none" : "block";

    // Hide any previous error message
    errorMessage.style.display = "none";
    errorMessage.textContent = "";
});

// Function to check if a username already exists in Firestore
async function isUsernameTaken(username) {
    const usersCollection = collection(db, "users");
    const usernameQuery = query(usersCollection, where("username", "==", username));
    const querySnapshot = await getDocs(usernameQuery);
    return !querySnapshot.empty; // Returns true if username is taken
}

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
            const username = usernameField.value.trim();
            if (!username) {
                errorMessage.textContent = "Please enter a username.";
                errorMessage.style.display = "block";
                return;
            }

            // Check if the username is already taken
            if (await isUsernameTaken(username)) {
                errorMessage.textContent = "Username is already taken. Please choose another.";
                errorMessage.style.display = "block";
                return;
            }

            // Create user with email and password
            const userCredential = await createUserWithEmailAndPassword(auth, email, password);
            const user = userCredential.user;

            // Save the username to Firestore
            await setDoc(doc(db, "users", user.uid), {
                username: username,
                email: user.email
            });

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
