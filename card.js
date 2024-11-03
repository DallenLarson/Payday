const apiKey = '7e56dabe-1394-4d6e-aa3b-f7250070b899';

// Get the card ID from the URL
const urlParams = new URLSearchParams(window.location.search);
const cardId = urlParams.get('id');

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
        document.getElementById('cardRarity').textContent = `Rarity: ${card.rarity}`;
        document.getElementById('cardPrice').textContent = card.cardmarket
            ? `Price: $${card.cardmarket.prices.averageSellPrice.toFixed(2)}`
            : 'Price: N/A';
    } catch (error) {
        console.error('Error fetching card details:', error);
    }
}

// Fetch the card details when the page loads
fetchCardDetails();
