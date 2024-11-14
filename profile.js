// Import necessary Firebase methods
import { auth, db } from "./firebaseConfig.js";
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/9.15.0/firebase-auth.js";
import { doc, getDoc, setDoc } from "https://www.gstatic.com/firebasejs/9.15.0/firebase-firestore.js";

// Path to profile picture folder
const PROFILE_PIC_FOLDER = 'pfp/';

// Dynamically generate profile picture filenames from avi1.png to avi25.png
const profilePics = Array.from({ length: 40 }, (_, i) => `avi${i + 1}.png`);

// Function to get or set a profile picture
async function setProfilePicture(filename = null) {
    const user = auth.currentUser;
    if (!user) return;

    const userRef = doc(db, "users", user.uid);
    const userDoc = await getDoc(userRef);

    let profilePicUrl;

    // Check if a specific filename is provided or if user already has a profile picture
    if (filename) {
        // Set the profile picture to the provided filename
        profilePicUrl = `${PROFILE_PIC_FOLDER}${filename}`;
    } else if (userDoc.exists() && userDoc.data().profilePic) {
        profilePicUrl = userDoc.data().profilePic;
    } else {
        // Choose a random picture if no filename is specified
        const randomPic = profilePics[Math.floor(Math.random() * profilePics.length)];
        profilePicUrl = `${PROFILE_PIC_FOLDER}${randomPic}`;
    }

    // Save the selected profile picture to the Firestore user document
    await setDoc(userRef, { profilePic: profilePicUrl }, { merge: true });

    // Display the profile picture on the account page
    displayProfilePicture(profilePicUrl);
}

// Force profile picture change with a specific filename - callable from the console
window.setSpecificProfilePicture = (filename) => setProfilePicture(filename);


// Function to display profile picture
function displayProfilePicture(profilePicUrl) {
    const profilePicElement = document.getElementById("profilePic");
    profilePicElement.src = profilePicUrl;
    profilePicElement.classList.add("circular-profile-pic");
}

// Force profile picture change - can be called from the console
window.forceChangeProfilePicture = () => setProfilePicture(true);

// Listen for authentication changes
onAuthStateChanged(auth, user => {
    if (user) {
        setProfilePicture();
    } else {
        console.log("No user is signed in.");
    }
});

export { setProfilePicture };
