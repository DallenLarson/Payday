import { auth } from "./firebaseConfig.js";
import { db } from "./firebaseConfig.js";
import { doc, setDoc, getDoc, updateDoc, arrayUnion } from "https://www.gstatic.com/firebasejs/9.15.0/firebase-firestore.js";

const apiKey = '7e56dabe-1394-4d6e-aa3b-f7250070b899';
const urlParams = new URLSearchParams(window.location.search);
const cardId = urlParams.get('id');
// Fetch and display card details
async function fetchCardDetails() {
    try {
        const response = await fetch(`https://api.pokemontcg.io/v2/cards/${cardId}`, {
            headers: {
                'X-Api-Key': apiKey,
                'Accept': 'application/json',
            }
        });
        const data = await response.json();
        const card = data.data;

        // Populate HTML elements
        document.getElementById('cardName').textContent = card.name;
        document.getElementById('cardImage').src = card.images.large;
        document.getElementById('cardSet').textContent = `Set: ${card.set.name}`;
        document.getElementById('cardRarity').textContent = card.rarity;
        document.getElementById('cardNumber').textContent = card.number;
        document.getElementById('cardType').textContent = card.supertype;
        document.getElementById('cardElement').textContent = card.types ? card.types.join(', ') : 'N/A';
        document.getElementById('cardClass').textContent = card.subtypes ? card.subtypes.join(', ') : 'N/A';
        document.getElementById('cardPrice').textContent = card.cardmarket
            ? `Price: $${card.cardmarket.prices.averageSellPrice.toFixed(2)}`
            : 'Price: N/A';

        document.title = `${card.name} (${card.number}/${card.set.total}) - ${card.set.name} | Payday`;

        updateMetaTags(card);
        renderPriceChart();

        // Define addButton and attach the click event to add the card to portfolio
        const addButton = document.getElementById('addButton');
        addButton.onclick = () => addToPortfolio(card);

    } catch (error) {
        console.error('Error fetching card details:', error);
    }
}

// Update Meta Tags
function updateMetaTags(card) {
    document.querySelector('meta[property="og:title"]').setAttribute("content", `Check ${card.name} out on Payday!`);
    document.querySelector('meta[property="og:image"]').setAttribute("content", card.images.large);
    document.title = `${card.name} | Payday`;
}

// Render Price Chart
function renderPriceChart() {
    const ctx = document.getElementById('priceChart').getContext('2d');
    new Chart(ctx, {
        type: 'line',
        data: {
            labels: ['Month 1', 'Month 2', 'Month 3'],
            datasets: [{
                label: 'Price in USD',
                data: [20, 25, 23], // Replace with actual price data if available
                borderColor: '#0073e6',
                backgroundColor: 'rgba(0, 115, 230, 0.2)',
                fill: true,
            }]
        },
        options: {
            responsive: true,
            scales: {
                x: {
                    title: {
                        display: true,
                        text: 'Date'
                    }
                },
                y: {
                    title: {
                        display: true,
                        text: 'Price in USD'
                    },
                    beginAtZero: false
                }
            }
        }
    });
}

// Add full card details to portfolio
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
    if (!user){
        
        console.error("Error adding card to portfolio: Can't find user!");
        return;
      };
  
    const portfolioRef = doc(db, "portfolios", user.uid);
    await updateDoc(portfolioRef, {
      cards: arrayUnion(card)
    });
    console.log("Card added to portfolio in Firestore:", card);
  }
  



// Go back to the main search page
function goToIndex() {
    window.history.back();
}

function goToPortfolio() {
    window.location.href = 'portfolio.html';
}

// Fetch the card details when the page loads

fetchCardDetails();
