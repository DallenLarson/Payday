import { auth } from "./firebaseConfig.js";
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/9.15.0/firebase-auth.js";
import { db } from "./firebaseConfig.js";

const apiKey = '7e56dabe-1394-4d6e-aa3b-f7250070b899';

// Fetch cards only if not cached in localStorage or if cache is outdated
async function fetchCards() {
    const cachedCards = localStorage.getItem("cards");
    const cacheDate = localStorage.getItem("cacheDate");
    const today = new Date().toDateString();

    if (cachedCards && cacheDate === today) {
        return JSON.parse(cachedCards);
    }

    try {
        const response = await fetch("https://api.pokemontcg.io/v2/cards?pageSize=50", {
            headers: {
                'X-Api-Key': apiKey,
                'Accept': 'application/json',
            }
        });
        const data = await response.json();
        localStorage.setItem("cards", JSON.stringify(data.data));
        localStorage.setItem("cacheDate", today);
        return data.data;
    } catch (error) {
        console.error("Error fetching card data:", error);
        return [];
    }
}

// Generate today's seed to pick the daily card
function getTodaySeed() {
    const today = new Date();
    return today.getFullYear() * 10000 + (today.getMonth() + 1) * 100 + today.getDate();
}

// Select a card based on today's date
function selectDailyCard(cards) {
    const seed = getTodaySeed();
    const index = seed % cards.length;
    return cards[index];
}

// Display "Card of the Day" when page loads
async function displayCardOfTheDay() {
    const cards = await fetchCards();
    if (cards.length === 0) return;

    const card = selectDailyCard(cards);
    document.getElementById("cardName").textContent = card.name;
    document.getElementById("cardContainerLink").href = `card.html?id=${card.id}`;
    document.getElementById("backgroundImage").src = card.images.large; // Set the background image
}




window.onload = displayCardOfTheDay;
