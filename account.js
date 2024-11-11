// Import Firebase methods
import { auth, db } from "./firebaseConfig.js";
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/9.15.0/firebase-auth.js";
import { doc, setDoc, getDoc, updateDoc, arrayUnion, arrayRemove } from "https://www.gstatic.com/firebasejs/9.15.0/firebase-firestore.js";

// Load and display user information
function displayUserInfo() {
    const user = auth.currentUser;
    if (user) {
        document.querySelector("#userEmail").textContent = user.email;
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
        cardImage.src = card.images?.small || "placeholder.png";
        cardImage.alt = card.name;
        cardImage.className = "portfolio-card-image";

        cardContainer.appendChild(cardImage);
        cardList.appendChild(cardContainer);
    });

    totalCardsElement.textContent = combinedPortfolio.reduce((sum, card) => sum + card.quantity, 0);
    totalValueElement.textContent = `$${totalValue.toFixed(2)}`;
    const favoriteType = Object.entries(typeCounts).reduce((a, b) => (b[1] > a[1] ? b : a), [null, 0])[0];
    favoriteTypeElement.textContent = favoriteType || "N/A";
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
