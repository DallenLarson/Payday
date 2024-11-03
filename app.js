const apiKey = '7e56dabe-1394-4d6e-aa3b-f7250070b899';
const searchInput = document.getElementById('searchInput');
const resultsContainer = document.getElementById('resultsContainer');
const sortDropdown = document.getElementById('sortDropdown');
let currentCards = [];

searchInput.addEventListener('input', async (event) => {
    const query = event.target.value.trim();
    if (query.length < 3) return;

    currentCards = await fetchCardData(query);
    displayResults(currentCards);
});

sortDropdown.addEventListener('change', () => {
    displayResults(currentCards);
});

async function fetchCardData(query) {
    try {
        const response = await fetch(`https://api.pokemontcg.io/v2/cards?q=name:${query}`, {
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
        default:
            return cards;
    }
}

function displayResults(cards) {
    resultsContainer.innerHTML = '';
    const sortedCards = sortCards([...cards]);

    sortedCards.forEach((card) => {
        // Create a link element to wrap the card
        const cardLink = document.createElement('a');
        cardLink.href = `card.html?id=${card.id}`; // Link to card.html with the card ID as a parameter

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

        // Append elements to the card
        cardElement.appendChild(img);
        cardElement.appendChild(name);
        cardElement.appendChild(setName);
        cardElement.appendChild(price);

        // Wrap the card element in the link
        cardLink.appendChild(cardElement);
        resultsContainer.appendChild(cardLink);
    });
}
