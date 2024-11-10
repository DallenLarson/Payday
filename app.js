import { auth } from "./firebaseConfig.js";
import { onAuthStateChanged, signOut as firebaseSignOut } from "https://www.gstatic.com/firebasejs/9.15.0/firebase-auth.js";
import { db } from "./firebaseConfig.js";
import { doc, setDoc, getDoc, updateDoc, arrayUnion } from "https://www.gstatic.com/firebasejs/9.15.0/firebase-firestore.js";

const apiKey = '7e56dabe-1394-4d6e-aa3b-f7250070b899';
const searchInput = document.getElementById('searchInput');
const resultsContainer = document.getElementById('resultsContainer');
const sortDropdown = document.getElementById('sortDropdown');
const loadingSpinner = document.getElementById('loadingSpinner');
const logoutButton = document.getElementById('logoutButton'); // Reference to the logout button

let currentCards = [];

// Show loading spinner
function showLoading() {
    loadingSpinner.style.display = 'block';
    document.body.classList.add('loading');
}

function toggleBackground() {
    if (searchInput.value.trim() === "") {
        document.body.classList.add("background-active");
        promotionContainer.style.display = "block";
    } else {
        document.body.classList.remove("background-active");
        promotionContainer.style.display = "none";
    }
}

// Initialize background check on load
toggleBackground();

// Hide loading spinner
function hideLoading() {
    loadingSpinner.style.display = 'none';
    document.body.classList.remove('loading');
}

// Check Firebase authentication state
onAuthStateChanged(auth, (user) => {
    if (user) {
        // User is signed in, display the logout button
    } else {
        // No user is signed in, redirect to login page
        window.location.href = "login.html";
    }
});
/*
// Handle logout
logoutButton.addEventListener('click', async () => {
    await firebaseSignOut(auth);
    window.location.href = "login.html"; // Redirect to login after logging out
});
*/
// Event listener for search input
searchInput.addEventListener('input', async (event) => {
    const query = event.target.value.trim();
    toggleBackground();

    if (query.length < 3) return;

    showLoading();

    currentCards = await fetchCardData(query);
    displayResults(currentCards);

    hideLoading();
});

// Sort dropdown event listener
sortDropdown.addEventListener('change', () => {
    displayResults(currentCards);
});

// Fetch card data from the API based on query (card name or set name)
async function fetchCardData(query) {
    try {
        // If the query is "All", fetch without filters
        const url = query.toLowerCase() === "all"
            ? `https://api.pokemontcg.io/v2/cards`
            : `https://api.pokemontcg.io/v2/cards?q=name:${query} OR set.name:${query}`;
        
        const response = await fetch(url, {
            headers: {
                'X-Api-Key': apiKey,
                'Accept': 'application/json',
            }
        });
        const data = await response.json();
        return data.data;
    } catch (error) {
        console.error('Error fetching card data:', error);
        return [];
    }
}


// Sort cards based on selected option
function sortCards(cards) {
    const sortOption = sortDropdown.value;
    switch (sortOption) {
        case 'date-new':
            return cards.sort((a, b) => new Date(b.set.releaseDate) - new Date(a.set.releaseDate));
        case 'date-old':
            return cards.sort((a, b) => new Date(a.set.releaseDate) - new Date(b.set.releaseDate));
        case 'price-high':
            return cards.sort((a, b) => (b.cardmarket?.prices.averageSellPrice || 0) - (a.cardmarket?.prices.averageSellPrice || 0));
        case 'price-low':
            return cards.sort((a, b) => (a.cardmarket?.prices.averageSellPrice || 0) - (b.cardmarket?.prices.averageSellPrice || 0));
        case 'set-name':
            return cards.sort((a, b) => a.set.name.localeCompare(b.set.name));
        default:
            return cards;
    }
}

// Function to add card to portfolio
async function addToPortfolio(card) {
    try {
      await addCardToPortfolio(card);
      alert(`${card.name} has been added to your portfolio!`);
    } catch (error) {
      console.error("Error adding card to portfolio:", error);
      alert("Failed to add card to portfolio.");
    }
  }
  

  async function addCardToPortfolio(card) {
    const user = auth.currentUser;
    if (!user) {
        console.error("Error adding card to portfolio: Can't find user!");
        return;
    }

    const portfolioRef = doc(db, "portfolios", user.uid);

    // Check if the portfolio document exists, create if it doesn’t
    const portfolioDoc = await getDoc(portfolioRef);
    if (!portfolioDoc.exists()) {
        await setDoc(portfolioRef, { cards: [] });
        console.log("Created new portfolio document for user:", user.uid);
    }

    // Now proceed with adding the card to the portfolio
    await updateDoc(portfolioRef, {
        cards: arrayUnion(card)
    });
    console.log("Card added to portfolio in Firestore:", card);
}
  


// Display results in the DOM with a Quick Add button
function displayResults(cards) {
    resultsContainer.innerHTML = '';
    const sortedCards = sortCards([...cards]);

    sortedCards.forEach((card) => {
        const cardContainer = document.createElement('div');
        cardContainer.className = 'card-container';

        const cardLink = document.createElement('a');
        cardLink.href = `card.html?id=${card.id}`;
        cardLink.className = 'card-link';

        const cardElement = document.createElement('div');
        cardElement.className = 'card';

        const img = document.createElement('img');
        img.src = card.images.small;
        img.alt = card.name;

        const name = document.createElement('p');
        name.textContent = card.name;

        const setName = document.createElement('p');
        setName.className = 'set-name';
        setName.textContent = card.set.name;

        const price = document.createElement('span');
        price.className = 'price';
        price.textContent = card.cardmarket ? `Price: $${card.cardmarket.prices.averageSellPrice.toFixed(2)}` : 'Price: N/A';

        cardElement.appendChild(img);
        cardElement.appendChild(name);
        cardElement.appendChild(setName);
        cardElement.appendChild(price);
        cardLink.appendChild(cardElement);

        const addButton = document.createElement('button');
        addButton.textContent = 'Quick Add';
        addButton.className = 'quick-add-button';
        addButton.onclick = () => addToPortfolio(card);

        cardContainer.appendChild(cardLink);
        cardContainer.appendChild(addButton);
        resultsContainer.appendChild(cardContainer);
    });
}
