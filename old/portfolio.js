// Import necessary Firebase methods
import { auth, db } from "./firebaseConfig.js";
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/9.15.0/firebase-auth.js";
import { doc, setDoc, getDoc, updateDoc, arrayUnion, arrayRemove } from "https://www.gstatic.com/firebasejs/9.15.0/firebase-firestore.js";

// Go back to the main search page
function goToIndex() {
    window.history.back();
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
        // Initialize an empty portfolio if it doesn't exist
        await setDoc(portfolioRef, { cards: [] });
        return [];
    }
}

// Save updated portfolio to Firestore
async function savePortfolioToFirestore(cards) {
    const user = auth.currentUser;
    if (!user) return;

    const portfolioRef = doc(db, "portfolios", user.uid);
    await setDoc(portfolioRef, { cards });
}

// Load portfolio and display it on the page
async function loadPortfolio(sortBy = 'alphabet') {
    const portfolio = await loadPortfolioFromFirestore();
    displayPortfolio(portfolio, sortBy);
}

// Display portfolio on the page
function displayPortfolio(portfolio, sortBy) {
    const cardList = document.getElementById('cardList');
    const totalValueElement = document.getElementById('totalValue');
    const totalCardsElement = document.getElementById('totalCards');
    const favoriteTypeElement = document.getElementById('favoriteType');

    cardList.innerHTML = '';

    if (portfolio.length === 0) {
        cardList.innerHTML = "<p>No Cards Added.</p>";
        totalValueElement.textContent = "$0.00";
        totalCardsElement.textContent = "0";
        favoriteTypeElement.textContent = "N/A";
        return;
    }

    // Combine duplicates by counting quantity
    const combinedPortfolio = portfolio.reduce((acc, card) => {
        const existingCard = acc.find(item => item.id === card.id);
        if (existingCard) {
            existingCard.quantity = (existingCard.quantity || 1) + 1;
        } else {
            acc.push({ ...card, quantity: 1 });
        }
        return acc;
    }, []);

    // Sort portfolio based on selected sorting criteria
    switch (sortBy) {
        case 'alphabet':
            combinedPortfolio.sort((a, b) => a.name.localeCompare(b.name));
            break;
        case 'price':
            combinedPortfolio.sort((a, b) => (b.cardmarket?.prices?.averageSellPrice || 0) - (a.cardmarket?.prices?.averageSellPrice || 0));
            break;
        // Add more sort options if needed
    }

    let totalValue = 0;
    let typeCounts = {};

    combinedPortfolio.forEach((card, index) => {
        const cardPrice = card.cardmarket?.prices?.averageSellPrice || 0;
        totalValue += cardPrice * card.quantity;

        if (card.types) {
            card.types.forEach(type => {
                typeCounts[type] = (typeCounts[type] || 0) + card.quantity;
            });
        }

        const setName = card.set?.name || 'Unknown Set';

        // Create card elements
        const cardContainer = document.createElement('div');
        cardContainer.className = 'card-entry';

        const cardLink = document.createElement('a');
        cardLink.href = `card.html?id=${card.id}`;
        cardLink.className = 'card-link';

        const cardImage = document.createElement('img');
        cardImage.src = card.images?.small || 'placeholder.png';
        cardImage.alt = card.name;
        cardImage.className = 'portfolio-card-image';

        const cardDetails = document.createElement('div');
        cardDetails.className = 'card-details';

        const cardName = document.createElement('p');
        cardName.className = 'card-name';
        cardName.textContent = card.name;

        const cardSet = document.createElement('p');
        cardSet.className = 'card-set';
        cardSet.textContent = `${setName} (${card.number} / ${card.set.total})`;

        const qtyPriceContainer = document.createElement('div');
        qtyPriceContainer.className = 'qty-price-container';

        const cardQuantity = document.createElement('p');
        cardQuantity.className = 'card-quantity';
        cardQuantity.textContent = `Qty: ${card.quantity}`;

        const cardPriceElement = document.createElement('p');
        cardPriceElement.className = 'card-price';
        cardPriceElement.textContent = `$${(cardPrice * 1).toFixed(2)}`;

        qtyPriceContainer.appendChild(cardQuantity);
        qtyPriceContainer.appendChild(cardPriceElement);

        const removeButton = document.createElement('button');
        removeButton.className = 'remove-button';
        removeButton.textContent = 'Remove';
        removeButton.onclick = async (event) => {
            event.preventDefault();
            await removeFromPortfolio(card.id);
            loadPortfolio(sortBy); // Refresh portfolio after removing a card
        };

        cardDetails.appendChild(cardName);
        cardDetails.appendChild(cardSet);
        cardDetails.appendChild(qtyPriceContainer);
        cardContainer.appendChild(cardLink);
        cardLink.appendChild(cardImage);
        cardContainer.appendChild(cardDetails);
        cardContainer.appendChild(removeButton);
        cardList.appendChild(cardContainer);
    });

    totalValueElement.textContent = `$${totalValue.toFixed(2)}`;
    totalCardsElement.textContent = combinedPortfolio.reduce((sum, card) => sum + card.quantity, 0);

    // Determine favorite type
    const favoriteType = Object.entries(typeCounts).reduce((a, b) => (b[1] > a[1] ? b : a), [null, 0])[0];
    favoriteTypeElement.textContent = favoriteType || "N/A";
}

// Add card to portfolio in Firestore
async function addToPortfolio(card) {
    const user = auth.currentUser;
    if (!user) return;

    const portfolioRef = doc(db, "portfolios", user.uid);
    await updateDoc(portfolioRef, {
        cards: arrayUnion(card) // Adds the card to Firestore array
    });
}

// Remove card from portfolio in Firestore
async function removeFromPortfolio(cardId) {
    const user = auth.currentUser;
    if (!user) return;

    const portfolioRef = doc(db, "portfolios", user.uid);
    const portfolioDoc = await getDoc(portfolioRef);

    if (portfolioDoc.exists()) {
        const updatedCards = portfolioDoc.data().cards.filter(card => card.id !== cardId);
        await setDoc(portfolioRef, { cards: updatedCards });
    }
}

// Listen for authentication changes and load portfolio if user is logged in
onAuthStateChanged(auth, user => {
    if (user) {
        loadPortfolio();
    } else {
        console.log("No user is signed in.");
    }
});
