const video = document.getElementById('cameraStream');
const scanButton = document.getElementById('scanButton');
const scanStatus = document.getElementById('scanStatus');

// Replace with your actual Vision API key and TCG API key
const googleVisionApiKey = 'AIzaSyC3Y9ursyrmj6IrLsAfv6nYV_uzCu-v53Y';
const tcgApiKey = '7e56dabe-1394-4d6e-aa3b-f7250070b899';

let validCardNames = new Set();

// Load valid Pokémon card names from the TCG API
async function loadValidCardNames() {
    try {
        const response = await fetch(`https://api.pokemontcg.io/v2/cards`, {
            headers: {
                'X-Api-Key': tcgApiKey,
                'Accept': 'application/json',
            }
        });
        const data = await response.json();
        data.data.forEach(card => validCardNames.add(card.name.toLowerCase()));
    } catch (error) {
        console.error('Error fetching card names:', error);
    }
}

// Start the camera
async function startCamera() {
    try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true });
        video.srcObject = stream;
    } catch (error) {
        console.error('Error accessing the camera:', error);
        scanStatus.textContent = 'Error: Unable to access camera.';
    }
}

// Function to scan for a card
async function scanForCard() {
    scanStatus.textContent = 'Scanning for card...';
    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const context = canvas.getContext('2d');
    context.drawImage(video, 0, 0, canvas.width, canvas.height);

    const imageDataUrl = canvas.toDataURL('image/png');
    const foundCard = await analyzeImageWithVisionAPI(imageDataUrl);

    if (foundCard) {
        addToPortfolio(foundCard);
        scanStatus.textContent = `Added ${foundCard.name} to portfolio!`;
    } else {
        scanStatus.textContent = 'No matching card found. Try again.';
    }
}

// Function to analyze the image using Google Vision API
async function analyzeImageWithVisionAPI(imageDataUrl) {
    const visionUrl = `https://vision.googleapis.com/v1/images:annotate?key=${googleVisionApiKey}`;

    const response = await fetch(visionUrl, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            requests: [
                {
                    image: {
                        content: imageDataUrl.split(',')[1] // Remove data:image/png;base64, prefix
                    },
                    features: [{ type: 'LABEL_DETECTION', maxResults: 5 }]
                }
            ]
        })
    });

    if (!response.ok) {
        console.error('Vision API error:', response.statusText);
        return null;
    }

    const result = await response.json();
    const labels = result.responses[0]?.labelAnnotations || [];

    // Match labels to valid Pokémon card names
    for (let label of labels) {
        if (label.description && validCardNames.has(label.description.toLowerCase())) {
            return { name: label.description, id: 'pgo-56' }; // Replace 'pgo-56' with actual card matching logic
        }
    }
    return null;
}

// Function to add the card to the portfolio
async function addToPortfolio(card) {
    const cardDetails = await fetchCardDetails(card.id);

    if (cardDetails) {
        const cardToAdd = {
            ...card,
            price: cardDetails.cardmarket?.prices.averageSellPrice || 0
        };

        let portfolio = JSON.parse(localStorage.getItem('portfolio')) || [];
        portfolio.push(cardToAdd);
        localStorage.setItem('portfolio', JSON.stringify(portfolio));
    } else {
        console.error('Failed to fetch card details.');
    }
}

// Fetch detailed card information
async function fetchCardDetails(cardId) {
    try {
        const response = await fetch(`https://api.pokemontcg.io/v2/cards/${cardId}`, {
            headers: {
                'X-Api-Key': tcgApiKey,
                'Accept': 'application/json',
            }
        });
        if (!response.ok) {
            console.error('Pokémon TCG API error:', response.statusText);
            return null;
        }
        const data = await response.json();
        return data.data;
    } catch (error) {
        console.error('Error fetching card details:', error);
        return null;
    }
}

// Initialize camera and load card names
window.onload = async () => {
    await loadValidCardNames();
    startCamera();
};

scanButton.onclick = scanForCard;

function goToIndex() {
    window.location.href = 'index.html';
}
