// Import Firebase methods
import { auth, db } from "./firebaseConfig.js";
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/9.15.0/firebase-auth.js";
import { collection, query, where, getDocs, doc, getDoc, setDoc } from "https://www.gstatic.com/firebasejs/9.15.0/firebase-firestore.js";

// Fetch user information based on auth or URL parameter
const urlParams = new URLSearchParams(window.location.search);
const username = urlParams.get("username");

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
        const profilePic = userData.profilePic || "placeholder.png"; // Use default if no profile pic
        document.querySelector("#userName").textContent = "@" + (userData.username || "Unknown User");
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

    const cardList = document.getElementById("cardList");
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
        cardImage.src = card.images?.small || "placeholder.png";
        cardImage.alt = card.name;
        cardImage.className = "portfolio-card-image";

        cardContainer.appendChild(cardImage);
        cardList.appendChild(cardContainer);

        cardContainer.addEventListener("click", () => openCardOverlay({
            imageUrl: cardImage.src,
            name: card.name,
            set: card.set?.name || "Unknown Set",
            value: card.cardmarket?.prices?.averageSellPrice || 0,
            pokedexEntry: card.pokedexEntry || "Entry not available."
        }));
    });

    totalCardsElement.textContent = portfolio.length;
    totalValueElement.textContent = `$${totalValue.toFixed(2)}`;
    const favoriteType = Object.entries(typeCounts).reduce((a, b) => (b[1] > a[1] ? b : a), [null, 0])[0];
    favoriteTypeElement.textContent = favoriteType || "N/A";
}

// Card overlay functions
function openCardOverlay(card) {
    const cardOverlay = document.getElementById("cardOverlay");
    document.getElementById("expandedCardImage").src = card.imageUrl;
    document.getElementById("cardName").textContent = card.name;
    document.getElementById("cardSet").textContent = card.set;
    document.getElementById("cardValue").textContent = `$${card.value.toFixed(2)}`;
    document.getElementById("pokedexEntry").textContent = card.pokedexEntry;

    cardOverlay.classList.remove("hidden");
    cardOverlay.style.opacity = "1";
    cardOverlay.addEventListener("click", closeCardOverlay);
}

function closeCardOverlay(event) {
    const cardOverlay = document.getElementById("cardOverlay");
    if (event.target === cardOverlay) {
        cardOverlay.style.opacity = "0";
        setTimeout(() => cardOverlay.classList.add("hidden"), 300);
    }
}

// Listen for authentication changes and load profile info
onAuthStateChanged(auth, user => {
    if (user) {
        displayUserProfile();
    } else {
        console.log("No user is signed in.");
    }
});
