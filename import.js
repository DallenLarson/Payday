const apiKey = '7e56dabe-1394-4d6e-aa3b-f7250070b899';

// Select DOM elements
const deckInput = document.getElementById('deckInput');
const cardList = document.getElementById('cardList');
const totalCostElement = document.getElementById('totalCost');

async function importDeck() {
    const deckText = deckInput.value.trim();
    const deckLines = deckText.split("\n");
    let totalCost = 0;
    cardList.innerHTML = ''; // Clear previous results

    for (const line of deckLines) {
        const cardDetails = parseCardLine(line);
        if (!cardDetails) continue;

        const { quantity, name, ptcgoCode, cardNumber } = cardDetails;
        const cardData = await fetchCardData(ptcgoCode, cardNumber, name);

        if (cardData) {
            const price = cardData.cardmarket?.prices?.averageSellPrice || 0;
            totalCost += price * quantity;

            // Display each card's details including image
            const cardElement = document.createElement('div');
            cardElement.className = 'card-entry';
            cardElement.innerHTML = `
                <img src="${cardData.images.small}" alt="${cardData.name}" class="card-image">
                <p>${quantity}x ${cardData.name} (${ptcgoCode} ${cardNumber}) - $${(price * quantity).toFixed(2)}</p>
            `;
            cardList.appendChild(cardElement);
        } else {
            console.error(`No data found for ${name} (${ptcgoCode} ${cardNumber})`);
        }
    }
    totalCostElement.textContent = `Total Cost: $${totalCost.toFixed(2)}`;
}

function parseCardLine(line) {
    const match = line.match(/(\d+)\s+(.+)\s([A-Z]{3})\s(\d+)/);
    if (!match) return null;
    return {
        quantity: parseInt(match[1]),
        name: match[2],
        ptcgoCode: match[3],
        cardNumber: match[4],
    };
}

async function fetchCardData(ptcgoCode, cardNumber, cardName) {
    try {
        // Extract base name without parenthesis for flexible matching
        const baseName = cardName.split(" (")[0].trim();

        // First attempt: Search by ptcgoCode and card number
        let response = await fetch(`https://api.pokemontcg.io/v2/cards?q=set.ptcgoCode:${ptcgoCode}%20number:${cardNumber}`, {
            headers: {
                'X-Api-Key': apiKey,
                'Accept': 'application/json',
            }
        });
        let data = await response.json();

        // If no data found, attempt to search by the alternative set id (e.g., sv1 for Scarlet & Violet)
        if (!data.data || data.data.length === 0) {
            const alternateId = ptcgoCode.toLowerCase(); // Convert ptcgoCode to lowercase for matching API ids
            response = await fetch(`https://api.pokemontcg.io/v2/cards?q=set.id:${alternateId}%20number:${cardNumber}`, {
                headers: {
                    'X-Api-Key': apiKey,
                    'Accept': 'application/json',
                }
            });
            data = await response.json();
        }

        // If still no data, try a generic search by card number, then filter by base name
        if (!data.data || data.data.length === 0) {
            response = await fetch(`https://api.pokemontcg.io/v2/cards?q=number:${cardNumber}`, {
                headers: {
                    'X-Api-Key': apiKey,
                    'Accept': 'application/json',
                }
            });
            data = await response.json();

            // Filter by base name to find the closest match
            if (data.data && data.data.length > 0) {
                data.data = data.data.filter(card => card.name.split(" (")[0].trim().toLowerCase() === baseName.toLowerCase());
            }
        }

        // Return the first matching card if found, otherwise null
        return data.data && data.data.length > 0 ? data.data[0] : null;
    } catch (error) {
        console.error(`Error fetching data for ${ptcgoCode} ${cardNumber}:`, error);
        return null;
    }
}


window.importDeck = importDeck;
