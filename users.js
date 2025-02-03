// Import Firebase and Firestore methods
import { db } from "./firebaseConfig.js";
import { collection, getDocs, doc, setDoc } from "https://www.gstatic.com/firebasejs/9.15.0/firebase-firestore.js";

// Fetch and display all users
async function displayAllUsers() {
    const usersListElement = document.getElementById("usersList");
    const usersCollection = collection(db, "users");
    const usersSnapshot = await getDocs(usersCollection);

    const PROFILE_PIC_FOLDER = 'pfp/';
    const profilePics = Array.from({ length: 42 }, (_, i) => `avi${i + 1}.png`);

    usersSnapshot.forEach(async (userDoc) => {
        const userData = userDoc.data();
        const username = userData.username || "Unknown User";
        let profilePic = userData.profilePic;

        // If no profile picture exists, assign a random one and save it
        if (!profilePic) {
            profilePic = `${PROFILE_PIC_FOLDER}${profilePics[Math.floor(Math.random() * profilePics.length)]}`;

            try {
                const userDocRef = doc(db, "users", userDoc.id);
                await setDoc(userDocRef, { profilePic }, { merge: true });
                console.log(`Assigned and saved new profile picture for ${username}: ${profilePic}`);
            } catch (error) {
                console.error(`Error saving profile picture for ${username}:`, error);
            }
        }

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
