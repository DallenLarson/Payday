// Import Firebase and Firestore methods
import { db } from "./firebaseConfig.js";
import { collection, getDocs } from "https://www.gstatic.com/firebasejs/9.15.0/firebase-firestore.js";

// Fetch and display all users
async function displayAllUsers() {
    const usersListElement = document.getElementById("usersList");
    const usersCollection = collection(db, "users");
    const usersSnapshot = await getDocs(usersCollection);

    usersSnapshot.forEach(doc => {
        const userData = doc.data();
        const username = userData.username || "Unknown User";
        const profilePic = userData.profilePic || "placeholder.png"; // Use a default image if profile picture is unavailable
        const isDev = userData.isDev || false;

        // Create user container
        const userBox = document.createElement("div");
        userBox.className = "user-item";

        // Profile picture
        const profileImage = document.createElement("img");
        profileImage.src = profilePic;
        profileImage.alt = `${username}'s profile picture`;
        userBox.appendChild(profileImage);

        // Username link
        const userLink = document.createElement("a");
        userLink.href = `user.html?username=${encodeURIComponent(username)}`;
        userLink.textContent = "@" + username;
        userBox.appendChild(userLink);

        // Developer tag
        if (isDev) {
            const devLabel = document.createElement("span");
            devLabel.className = "dev-label";
            devLabel.textContent = "DEV";
            userBox.appendChild(devLabel);
        }

        usersListElement.appendChild(userBox);
    });
}

displayAllUsers();
