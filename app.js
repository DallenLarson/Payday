const apiKey = '7e56dabe-1394-4d6e-aa3b-f7250070b899';
const searchInput = document.getElementById('searchInput');
const resultsContainer = document.getElementById('resultsContainer');
const sortDropdown = document.getElementById('sortDropdown');
const loadingSpinner = document.getElementById('loadingSpinner');
let currentCards = [];

// Show loading spinner
function showLoading() {
    loadingSpinner.style.display = 'block';
    document.body.classList.add('loading');
}

// Hide loading spinner
function hideLoading() {
    loadingSpinner.style.display = 'none';
    document.body.classList.remove('loading');
}

// Event listener for search input
searchInput.addEventListener('input', async (event) => {
    const query = event.target.value.trim();
    if (query.length < 3) return;

    showLoading(); // Show loading spinner

    currentCards = await fetchCardData(query);
    displayResults(currentCards);

    hideLoading(); // Hide loading spinner
});

// Sort dropdown event listener
sortDropdown.addEventListener('change', () => {
    displayResults(currentCards);
});

// Fetch card data from the API based on query
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
function addToPortfolio(card) {
    // Retrieve existing portfolio or create an empty array
    let portfolio = JSON.parse(localStorage.getItem('portfolio')) || [];

    // Add the card to the portfolio
    portfolio.push({
        id: card.id,
        name: card.name,
        price: card.cardmarket?.prices.averageSellPrice || 0
    });

    // Update the portfolio in local storage
    localStorage.setItem('portfolio', JSON.stringify(portfolio));

    alert(`${card.name} has been added to your portfolio!`);
}

// Display results in the DOM with a Quick Add button
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

        // Quick Add Button
        const addButton = document.createElement('button');
        addButton.textContent = 'Quick Add';
        addButton.className = 'quick-add-button';
        addButton.onclick = () => addToPortfolio(card); // Add card to portfolio on click

        // Append elements to the card
        cardElement.appendChild(img);
        cardElement.appendChild(name);
        cardElement.appendChild(setName);
        cardElement.appendChild(price);
        cardElement.appendChild(addButton); // Add the Quick Add button to the card

        // Wrap the card element in the link
        cardLink.appendChild(cardElement);
        resultsContainer.appendChild(cardLink);
    });
}

