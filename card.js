const apiKey = '7e56dabe-1394-4d6e-aa3b-f7250070b899';
const urlParams = new URLSearchParams(window.location.search);
const cardId = urlParams.get('id');

// Function to fetch and display the card details
// Function to fetch and display the card details
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

        // Populate the HTML elements with card details
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

        // Set the page title dynamically
        document.title = `Payday | ${card.name} (${card.number}/${card.set.total}) - ${card.set.name} Details`;

        // Mocked price data for demonstration (replace with actual data if available)
        const priceData = {
            labels: ['Month 1', 'Month 2', 'Month 3'], // Replace with actual months if available
            prices: [20, 25, 23] // Replace with actual price data
        };

        // Render the price chart
        renderPriceChart(priceData);
    } catch (error) {
        console.error('Error fetching card details:', error);
    }
}


// Function to render the price chart using Chart.js
function renderPriceChart(priceData) {
    const ctx = document.getElementById('priceChart').getContext('2d');
    new Chart(ctx, {
        type: 'line',
        data: {
            labels: priceData.labels,
            datasets: [{
                label: 'Price in USD',
                data: priceData.prices,
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

function addToPortfolio() {
    const cardName = document.getElementById('cardName').textContent;
    const cardPriceText = document.getElementById('cardPrice').textContent;
    const cardPrice = parseFloat(cardPriceText.replace('Price: $', ''));

    // Get existing portfolio from local storage or create a new one
    let portfolio = JSON.parse(localStorage.getItem('portfolio')) || [];

    // Add the card to the portfolio
    portfolio.push({
        name: cardName,
        price: cardPrice,
        id: cardId
    });

    // Save the updated portfolio back to local storage
    localStorage.setItem('portfolio', JSON.stringify(portfolio));

    alert(`${cardName} has been added to your portfolio!`);
}

// Go back to the main search page
function goToIndex() {
    window.location.href = 'index.html';
}

function goToPortfolio() {
    window.location.href = 'portfolio.html';
}

// Fetch the card details when the page loads
fetchCardDetails();
