// Import Firebase methods
import { auth, db } from "./firebaseConfig.js";
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/9.15.0/firebase-auth.js";
import { collection, query, where, getDocs, doc, getDoc, setDoc } from "https://www.gstatic.com/firebasejs/9.15.0/firebase-firestore.js";

// Fetch user information based on auth or URL parameter
const urlParams = new URLSearchParams(window.location.search);
const username = urlParams.get("username");

const cardOverlay = document.getElementById("cardOverlay");
const cardDetailContainer = document.getElementById("cardDetailContainer");
const expandedCardImage = document.getElementById("expandedCardImage");
const cardList = document.getElementById("cardList"); // Parent container for cards

async function displayUserProfile() {
    let userDocRef;

    if (username) {
        // Query Firestore by username if provided in the URL
        const usersCollection = collection(db, "users");
        const usernameQuery = query(usersCollection, where("username", "==", username));
        const querySnapshot = await getDocs(usernameQuery);

        if (!querySnapshot.empty) {
            userDocRef = doc(db, "users", querySnapshot.docs[0].id);
        } else {
            console.log("User not found.");
            return;
        }
    } else {
        // Display current authenticated user's info if no username parameter
        const user = auth.currentUser;
        if (!user) {
            console.log("No user is signed in.");
            return;
        }
        userDocRef = doc(db, "users", user.uid);
    }

    const userDoc = await getDoc(userDocRef);
    if (userDoc.exists()) {
        const userData = userDoc.data();
        document.querySelector("#userName").textContent = "@" + (userData.username || "Unknown User");

        const PROFILE_PIC_FOLDER = 'pfp/';
        const profilePics = Array.from({ length: 42 }, (_, i) => `avi${i + 1}.png`);
        let profilePic = userData.profilePic;

        if (!profilePic) {
            // Randomly pick a new profile picture
            profilePic = `${PROFILE_PIC_FOLDER}${profilePics[Math.floor(Math.random() * profilePics.length)]}`;

            // Save it to Firestore
            try {
                await setDoc(userDocRef, { profilePic }, { merge: true });
                console.log("New profile picture saved:", profilePic);
            } catch (error) {
                console.error("Error saving profile picture:", error);
            }
        }

        document.querySelector("#profilePic").src = profilePic;

        const isDev = userData.isDev || false;
        if (isDev) {
            const devLabel = document.createElement("span");
            devLabel.className = "dev-label";
            devLabel.textContent = "DEV";
            document.querySelector(".profile-header").appendChild(devLabel);
        }

        loadPortfolio(userDocRef.id);
    } else {
        console.log("User document not found.");
    }
}


async function loadPortfolio(userId) {
    const portfolioRef = doc(db, "portfolios", userId);
    const portfolioDoc = await getDoc(portfolioRef);

    const totalCardsElement = document.getElementById("totalCards");
    const totalValueElement = document.getElementById("totalValue");
    const favoriteTypeElement = document.getElementById("favoriteType");

    if (!portfolioDoc.exists()) {
        cardList.innerHTML = "<p>No Cards Added.</p>";
        totalCardsElement.textContent = "0";
        totalValueElement.textContent = "$0.00";
        favoriteTypeElement.textContent = "N/A";
        return;
    }

    const portfolio = portfolioDoc.data().cards || [];
    let totalValue = 0;
    const typeCounts = {};
    cardList.innerHTML = '';

    portfolio.forEach(card => {
        totalValue += (card.cardmarket?.prices?.averageSellPrice || 0) * (card.quantity || 1);
        card.types?.forEach(type => {
            typeCounts[type] = (typeCounts[type] || 0) + (card.quantity || 1);
        });

        const cardContainer = document.createElement("div");
        cardContainer.className = "card-entry";
        const cardImage = document.createElement("img");
        const PROFILE_PIC_FOLDER = 'pfp/';
        const profilePics = Array.from({ length: 42 }, (_, i) => `avi${i + 1}.png`);
        cardImage.src = card.images?.large || `${PROFILE_PIC_FOLDER}${profilePics[Math.floor(Math.random() * profilePics.length)]}`;
        cardImage.alt = card.name;
        cardImage.className = "portfolio-card-image";

        cardContainer.appendChild(cardImage);
        cardList.appendChild(cardContainer);

        // Add 3D tilt effect to each card image
        cardImage.addEventListener('mousemove', (event) => {
            const rect = cardImage.getBoundingClientRect();
            const x = event.clientX - rect.left;
            const y = event.clientY - rect.top;
            const rotateY = ((x / rect.width) - 0.5) * 30;
            const rotateX = ((y / rect.height) - 0.5) * -30;
            cardImage.style.transform = `rotateY(${rotateY}deg) rotateX(${rotateX}deg)`;
        });

        cardImage.addEventListener('mouseleave', () => {
            cardImage.style.transform = 'rotateY(0deg) rotateX(0deg)';
        });
    });

    totalCardsElement.textContent = portfolio.length;
    totalValueElement.textContent = `$${totalValue.toFixed(2)}`;
    const favoriteType = Object.entries(typeCounts).reduce((a, b) => (b[1] > a[1] ? b : a), [null, 0])[0];
    favoriteTypeElement.textContent = favoriteType || "N/A";
}

// Listen for authentication changes and load profile info
onAuthStateChanged(auth, user => {
    if (user) {
        displayUserProfile();
    } else {
        console.log("No user is signed in.");
    }
});

// Function to show the overlay with the clicked card's image
function showCardOverlay(cardImageSrc) {
    console.log("showCardOverlay called"); // Debug log
    expandedCardImage.src = cardImageSrc;
    cardOverlay.classList.add("visible");

    // Example data; replace these with real values from your card object
    document.getElementById('cardInfoName').textContent = "Sample Card Name";
    document.getElementById('cardInfoSet').textContent = "Set: Sample Set";
    document.getElementById('cardInfoPrice').textContent = "Price: $15.99";

    // Add 3D tilt effect to the expanded card image using the full overlay area
    cardOverlay.addEventListener('mousemove', (event) => {
        const rect = cardOverlay.getBoundingClientRect();
        const x = event.clientX - rect.left;
        const y = event.clientY - rect.top;
        const rotateY = ((x / rect.width) - 0.5) * 30;
        const rotateX = ((y / rect.height) - 0.5) * -30;
        expandedCardImage.style.transform = `rotateY(${rotateY}deg) rotateX(${rotateX}deg)`;
    });

    cardOverlay.addEventListener('mouseleave', () => {
        expandedCardImage.style.transform = 'rotateY(0deg) rotateX(0deg)';
    });

    console.log("Overlay should now be visible"); // Debug log
}


// Event delegation for dynamically loaded card images
cardList.addEventListener("click", (e) => {
    if (e.target.classList.contains("portfolio-card-image")) {
        console.log("Card image clicked:", e.target.src); // Debug log
        showCardOverlay(e.target.src);
    }
});

// Hide overlay when clicking outside the card detail
cardOverlay.addEventListener("click", (e) => {
    if (e.target === cardOverlay) {
        console.log("Overlay clicked to close"); // Debug log
        cardOverlay.classList.remove("visible");
        expandedCardImage.style.transform = 'rotateY(0deg) rotateX(0deg)'; // Reset any tilt
    }
});
