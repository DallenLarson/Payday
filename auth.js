import { auth } from "./firebaseConfig.js";
import { 
    createUserWithEmailAndPassword, 
    signInWithEmailAndPassword, 
    signOut 
} from "firebase/auth";

// Register a new user
async function registerUser(email, password) {
    try {
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        console.log("User registered:", userCredential.user);
        alert("Registration successful!");
    } catch (error) {
        console.error("Error registering user:", error.message);
        alert(error.message);
    }
}

// Login an existing user
async function loginUser(email, password) {
    try {
        const userCredential = await signInWithEmailAndPassword(auth, email, password);
        console.log("User logged in:", userCredential.user);
        alert("Login successful!");
    } catch (error) {
        console.error("Error logging in:", error.message);
        alert(error.message);
    }
}

// Logout the current user
function logoutUser() {
    signOut(auth)
        .then(() => {
            console.log("User logged out");
            alert("Logout successful!");
        })
        .catch((error) => {
            console.error("Error logging out:", error.message);
        });
}

export { registerUser, loginUser, logoutUser };
