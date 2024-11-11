import { auth } from "./firebaseConfig.js";
import { getFirestore, doc, getDoc, setDoc } from "https://www.gstatic.com/firebasejs/9.15.0/firebase-firestore.js";

const db = getFirestore();

// Function to create a username from email if none exists
export async function createUsernameIfNoneExists(user) {
    try {
        // Reference to the user's document in Firestore
        const userDocRef = doc(db, "users", user.uid);
        
        // Check if the user already has a username
        const userDoc = await getDoc(userDocRef);
        if (userDoc.exists() && userDoc.data().username) {
            console.log("Username already exists:", userDoc.data().username);
            return; // Username already exists, so exit the function
        }

        // Generate a username from the email
        const emailPrefix = user.email.split("@")[0];
        const generatedUsername = `${emailPrefix}`;

        // Save the generated username to Firestore
        await setDoc(userDocRef, { 
            username: generatedUsername, 
            email: user.email 
        }, { merge: true }); // Merge to avoid overwriting other data
        
        console.log("Username created:", generatedUsername);
    } catch (error) {
        console.error("Error creating username:", error);
    }
}

// Usage example:
// Call this function after registration to generate a username if needed
auth.onAuthStateChanged(async (user) => {
    if (user) {
        await createUsernameIfNoneExists(user);
    }
});
