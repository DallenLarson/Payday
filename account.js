// Import Firebase methods
import { auth, db } from "./firebaseConfig.js";
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/9.15.0/firebase-auth.js";
import { doc, setDoc, getDoc } from "https://www.gstatic.com/firebasejs/9.15.0/firebase-firestore.js";

// Load and display user information
async function displayUserInfo() {
    const user = auth.currentUser;
    if (user) {
        // Fetch user document from Firestore
        const userDocRef = doc(db, "users", user.uid);
        const userDoc = await getDoc(userDocRef);

        if (userDoc.exists()) {
            const userData = userDoc.data();
            const username = userData.username || user.email.split("@")[0]; // Fallback to email prefix if username not found
            document.querySelector("#userName").textContent = "@" + username;

            // Check if user is a developer
            const isDev = userData.isDev || false;
            if (isDev) {
                // Create and display "DEV" label
                const devLabel = document.createElement("span");
                devLabel.className = "dev-label";
                devLabel.textContent = "DEV";
                document.querySelector("#profileContainer .profile-header").appendChild(devLabel);
            }
        } else {
            console.log("No user document found.");
        }
    }
}

// Load portfolio from Firestore
async function loadPortfolioFromFirestore() {
    const user = auth.currentUser;
    if (!user) return [];

    const portfolioRef = doc(db, "portfolios", user.uid);
    const portfolioDoc = await getDoc(portfolioRef);

    if (portfolioDoc.exists()) {
        return portfolioDoc.data().cards || [];
    } else {
        await setDoc(portfolioRef, { cards: [] });
        return [];
    }
}

// Display portfolio on the page
async function displayPortfolio(sortBy = 'alphabet') {
    const portfolio = await loadPortfolioFromFirestore();
    const cardList = document.getElementById("cardList");
    const totalCardsElement = document.getElementById("totalCards");
    const favoriteTypeElement = document.getElementById("favoriteType");
    const totalValueElement = document.getElementById("totalValue");

    cardList.innerHTML = '';

    if (portfolio.length === 0) {
        cardList.innerHTML = "<p>No Cards Added.</p>";
        totalCardsElement.textContent = "0";
        totalValueElement.textContent = "$0.00";
        favoriteTypeElement.textContent = "N/A";
        return;
    }

    const combinedPortfolio = portfolio.reduce((acc, card) => {
        const existingCard = acc.find(item => item.id === card.id);
        if (existingCard) {
            existingCard.quantity = (existingCard.quantity || 1) + 1;
        } else {
            acc.push({ ...card, quantity: 1 });
        }
        return acc;
    }, []);

    let totalValue = 0;
    const typeCounts = {};

    combinedPortfolio.forEach(card => {
        const cardPrice = card.cardmarket?.prices?.averageSellPrice || 0;
        totalValue += cardPrice * card.quantity;

        card.types?.forEach(type => {
            typeCounts[type] = (typeCounts[type] || 0) + card.quantity;
        });

        const cardContainer = document.createElement("div");
        cardContainer.className = "card-entry";

        const cardImage = document.createElement("img");
        
        const PROFILE_PIC_FOLDER = 'pfp/';
        const profilePics = Array.from({ length: 42 }, (_, i) => `avi${i + 1}.png`);
        cardImage.src = card.images?.small || `${PROFILE_PIC_FOLDER}${profilePics[Math.floor(Math.random() * profilePics.length)]}`;
        cardImage.alt = card.name;
        cardImage.className = "portfolio-card-image";

        cardContainer.appendChild(cardImage);
        cardList.appendChild(cardContainer);

        // Attach click event to open overlay
        cardContainer.addEventListener("click", () => openCardOverlay({
            imageUrl: cardImage.src,
            name: card.name,
            set: card.set?.name || "Unknown Set",
            value: cardPrice,
            pokedexEntry: card.pokedexEntry || "Entry not available."
        }));
    });

    totalCardsElement.textContent = combinedPortfolio.reduce((sum, card) => sum + card.quantity, 0);
    totalValueElement.textContent = `$${totalValue.toFixed(2)}`;
    const favoriteType = Object.entries(typeCounts).reduce((a, b) => (b[1] > a[1] ? b : a), [null, 0])[0];
    favoriteTypeElement.textContent = favoriteType || "N/A";
}

// Variables for overlay and card details
const cardOverlay = document.getElementById("cardOverlay");
const expandedCardImage = document.getElementById("expandedCardImage");
const cardName = document.getElementById("cardName");
const cardSet = document.getElementById("cardSet");
const cardValue = document.getElementById("cardValue");
const pokedexEntry = document.getElementById("pokedexEntry");


window.auth = auth;

// Function to open card overlay with details
function openCardOverlay(card) {
    console.log("Opening card overlay with card details:", card);

    // Set the card details
    expandedCardImage.src = card.imageUrl;
    cardName.textContent = card.name;
    cardSet.textContent = card.set;
    cardValue.textContent = `$${card.value.toFixed(2)}`;
    pokedexEntry.textContent = card.pokedexEntry;

    // Apply smooth transition and show overlay
    cardOverlay.classList.remove("hidden");
    cardOverlay.style.opacity = "1";
    console.log("Card overlay displayed");

    // Close overlay on clicking outside the grey box
    cardOverlay.addEventListener("click", closeCardOverlay);
}

// Function to close card overlay
function closeCardOverlay(event) {
    if (event.target === cardOverlay) {
        console.log("Closing card overlay");

        cardOverlay.style.opacity = "0";
        setTimeout(() => {
            cardOverlay.classList.add("hidden");
        }, 300);
    }
}

// Listen for authentication changes and load user information and portfolio if signed in
onAuthStateChanged(auth, user => {
    if (user) {
        displayUserInfo();
        displayPortfolio();
    } else {
        console.log("No user is signed in.");
    }
});
