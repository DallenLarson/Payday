import { auth, db } from "./firebaseConfig.js";
import { onAuthStateChanged, signOut as firebaseSignOut } from "https://www.gstatic.com/firebasejs/9.15.0/firebase-auth.js";
import { collection, doc, getDoc } from "https://www.gstatic.com/firebasejs/9.15.0/firebase-firestore.js";
import { getDocs } from "https://www.gstatic.com/firebasejs/9.15.0/firebase-firestore.js";

const logoutButton = document.getElementById('logoutButton');
const portfolioValueElement = document.getElementById('portfolioValue');
const portfolioChangeElement = document.getElementById('portfolioChange');

const apiKey = '7e56dabe-1394-4d6e-aa3b-f7250070b899';

// Portfolio data structure to store cumulative values by range
let portfolioData = {
    "1D": { values: [], labels: [] },
    "1W": { values: [], labels: [] },
    "1M": { values: [], labels: [] },
};

// Initialize chart
let portfolioChart = new Chart(document.getElementById('portfolioChart').getContext('2d'), {
    type: 'line',
    data: {
        labels: [],  // Empty labels to be updated
        datasets: [{
            label: "Portfolio Value",
            data: [],
            borderColor: '#00ff9d',
            fill: false
        }]
    },
    options: {
        scales: {
            x: { display: true, title: { display: true, text: 'Date' } },
            y: { display: true, beginAtZero: false }
        },
        plugins: {
            legend: { display: false }
        }
    }
});

async function updatePortfolioSummary() {
    const user = auth.currentUser;
    if (!user) return;

    try {
        const portfolioRef = doc(db, "portfolios", user.uid);
        const portfolioDoc = await getDoc(portfolioRef);

        if (!portfolioDoc.exists()) {
            console.log("No portfolio data found for this user.");
            return;
        }

        // Retrieve and log the portfolio data for debugging
        const portfolio = portfolioDoc.data().cards || [];
        console.log("Retrieved portfolio:", portfolio);

        let totalValue = 0;
        let previousDayValue = 0;

        // Verify each card in portfolio
        portfolio.forEach((card, index) => {
            console.log(`Processing card ${index + 1}:`, card);

            if (!card || !card.cardmarket || !card.cardmarket.prices) {
                console.warn("Card data missing expected structure:", card);
                return; // Skip this card if the structure is incorrect
            }

            const cardPrices = card.cardmarket.prices;

            // Log card price data for diagnostics
            console.log("Card Prices:", cardPrices);

            // Use `averageSellPrice` as the current price, default to 0 if not available
            const currentPrice = cardPrices.averageSellPrice || 0;
            totalValue += currentPrice;

            // Use `averageSellPrice` as the previous day price, default to 0 if not available
            const previousPrice = cardPrices.averageSellPrice || 0;
            previousDayValue += previousPrice;
        });

        const changeValue = totalValue - previousDayValue;
        const changePercentage = previousDayValue ? ((changeValue / previousDayValue) * 100).toFixed(2) : 0;

        portfolioValueElement.textContent = `$${totalValue.toFixed(2)}`;
        portfolioChangeElement.textContent = `${changeValue >= 0 ? '▲' : '▼'} $${Math.abs(changeValue).toFixed(2)} (${changePercentage}%) This Week`;
        portfolioChangeElement.className = changeValue >= 0 ? "green" : "red";

    } catch (error) {
        console.error("Error updating portfolio summary:", error);
    }
}


onAuthStateChanged(auth, async (user) => {
    if (user) {
        await loadPortfolioData(user.uid);
        updatePortfolioSummary();
    } else {
        window.location.href = "login.html";
    }
});
/*
logoutButton.addEventListener('click', async () => {
    await firebaseSignOut(auth);
    window.location.href = "login.html";
});
*/
async function loadPortfolioData(userId) {
    try {
        const portfolioRef = doc(db, "portfolios", userId);
        const portfolioDoc = await getDoc(portfolioRef);

        if (portfolioDoc.exists()) {
            const portfolio = portfolioDoc.data().cards;
            calculatePortfolioValues(portfolio);

            // Update the chart with the default range (e.g., 1W) on load
        } else {
            console.log("No portfolio data found for this user.");
        }
    } catch (error) {
        console.error("Error loading portfolio data:", error);
    }
}

// Linear interpolation function
function lerp(start, end, t) {
    return start + t * (end - start);
}async function calculatePortfolioValues(portfolio) {
    const today = new Date();
    const oneDayAgo = new Date(today);
    oneDayAgo.setDate(today.getDate() - 1);

    const oneWeekAgo = new Date(today);
    oneWeekAgo.setDate(today.getDate() - 7);

    const oneMonthAgo = new Date(today);
    oneMonthAgo.setDate(today.getDate() - 30);

    let totalCurrentValue = 0;
    let avg1Total = 0;
    let avg7Total = 0;
    let avg30Total = 0;

    // Calculate cumulative values for avg1, avg7, and avg30
    portfolio.forEach(card => {
        const cardPrices = card.cardmarket?.prices || {};

        const currentPrice = cardPrices.averageSellPrice || 0;
        const avg1 = cardPrices.avg1 || currentPrice;
        const avg7 = cardPrices.avg7 || currentPrice;
        const avg30 = cardPrices.avg30 || currentPrice;

        totalCurrentValue += currentPrice;
        avg1Total += avg1;
        avg7Total += avg7;
        avg30Total += avg30;
    });

    console.log("Portfolio Value Summary:");
    console.log(`Current Value (averageSellPrice): $${totalCurrentValue.toFixed(2)}`);
    console.log(`Yesterday's Value (avg1): $${avg1Total.toFixed(2)}`);
    console.log(`1 Week Ago Value (avg7): $${avg7Total.toFixed(2)}`);
    console.log(`1 Month Ago Value (avg30): $${avg30Total.toFixed(2)}`);

    // Set the 1D range with two fixed values: yesterday (avg1) and today (current)
    portfolioData["1D"].values = [
        avg1Total, // Total avg1 for "yesterday"
        totalCurrentValue // Total averageSellPrice for "today"
    ];
    portfolioData["1D"].labels = [
        oneDayAgo.toLocaleDateString(),
        today.toLocaleDateString()
    ];

    // Set the 1W range, using avg7 for 7 days ago, interpolating to avg1 for yesterday, and ending with today's value
    portfolioData["1W"].values = [
        avg7Total, // Total avg7 for 7 days ago
        ...calculateInterpolatedDailyValues(avg7Total, avg1Total, 5), // Interpolated values for days 6 to 2
        avg1Total, // Total avg1 for "yesterday"
        totalCurrentValue // Today's averageSellPrice
    ];

    // Set the 1M range, using avg30 for 30 days ago, interpolating to avg7 for 7 days ago, and ending with today's value
    portfolioData["1M"].values = [
        avg30Total, // Total avg30 for 30 days ago
        ...calculateInterpolatedDailyValues(avg30Total, avg7Total, 21), // Interpolated values for days 29 to 8
        avg7Total, // Total avg7 for "one week ago" (7 days from today)
        ...calculateInterpolatedDailyValues(avg7Total, avg1Total, 5), // Interpolated values for days 6 to 2
        avg1Total, // Total avg1 for "yesterday"
        totalCurrentValue // Today's averageSellPrice
    ];

    addDataPoints("1W", oneWeekAgo, 8); // 8 days for 1W, starting with avg7 and ending with averageSellPrice
    addDataPoints("1M", oneMonthAgo, 30); // 30 days for 1M, starting with avg30 and ending with averageSellPrice

    // Update portfolio summary display
    portfolioValueElement.textContent = `$${totalCurrentValue.toFixed(2)}`;
}

// Function to calculate interpolated values, accepting start and end values for consistency
const calculateInterpolatedDailyValues = (startValue, endValue, days) => {
    let interpolatedValues = [];
    for (let i = 1; i <= days; i++) {
        const t = i / days; // Interpolation factor
        const interpolatedValue = lerp(startValue, endValue, t);
        interpolatedValues.push(interpolatedValue);
    }
    return interpolatedValues;
};

// Adds the necessary data points for 1W (8 days) and 1M (30 days)
function addDataPoints(range, startDate, daysOverride = null) {
    const rangeData = portfolioData[range];
    rangeData.labels = [];

    const days = daysOverride || (range === "1W" ? 6 : 29);
    for (let i = 0; i <= days; i++) {
        const pastDate = new Date(startDate);
        pastDate.setDate(pastDate.getDate() + i); // Increment from the start date to today
        rangeData.labels.push(pastDate.toLocaleDateString());
    }
}

function updateChart(range) {
    const dataForRange = portfolioData[range];
    portfolioChart.data.labels = dataForRange.labels || [];
    portfolioChart.data.datasets[0].data = dataForRange.values || [];

    // Determine color based on trend: green for increase, red for decrease
    const firstValue = dataForRange.values[0];
    const lastValue = dataForRange.values[dataForRange.values.length - 1];
    const isIncreasing = lastValue > firstValue;

    portfolioChart.data.datasets[0].borderColor = isIncreasing ? '#00ff9d' : '#ff4d4d';

    // Determine the change value and percentage for the selected range
    const changeValue = lastValue - firstValue;
    const changePercentage = firstValue ? ((changeValue / firstValue) * 100).toFixed(2) : 0;

    // Set the label based on the selected range
    let rangeLabel;
    switch (range) {
        case "1D":
            rangeLabel = "Today";
            break;
        case "1W":
            rangeLabel = "This Week";
            break;
        case "1M":
            rangeLabel = "This Month";
            break;
        default:
            rangeLabel = "";
    }

    // Update the portfolio change element with the calculated values and label
    portfolioChangeElement.textContent = `${changeValue >= 0 ? '▲' : '▼'} $${Math.abs(changeValue).toFixed(2)} (${changePercentage}%) ${rangeLabel}`;

    // Set the text color based on whether the change is positive or negative
    portfolioChangeElement.className = changeValue >= 0 ? "green" : "red";

    portfolioChart.update();
}

window.updateChart = updateChart;

async function getTopViewedCards() {
    const now = Date.now();
    const oneDayAgo = now - 24 * 60 * 60 * 1000; // 24 hours
    const eightyFiveDaysAgo = now - 2048 * 60 * 60 * 1000; // 2048 hours

    try {
        const cardViewsRef = collection(db, "cardViews");
        const snapshot = await getDocs(cardViewsRef);

        const views = [];

        snapshot.forEach(doc => {
            const viewData = doc.data();
            const recentViews = viewData.views.filter(
                view => view.toMillis() >= oneDayAgo
            );
            const fallbackViews = viewData.views.filter(
                view => view.toMillis() >= eightyFiveDaysAgo
            );
            views.push({
                cardId: doc.id,
                count: recentViews.length || fallbackViews.length,
                fallback: recentViews.length === 0 && fallbackViews.length > 0,
            });
        });

        // Sort by view count
        const topCards = views
            .filter(v => v.count > 0) // Ensure there's at least one view
            .sort((a, b) => b.count - a.count)
            .slice(0, 5);

        // If no cards found, pick 5 random cards
        if (topCards.length === 0) {
            const randomCards = await fetchRandomCards(5);
            return randomCards.map(card => ({
                cardId: card.id,
                count: 0,
                fallback: true,
            }));
        }

        return topCards;
    } catch (error) {
        console.error("Error fetching top viewed cards:", error);
        return [];
    }
}

// Fetch random cards if no views exist
async function fetchRandomCards(count) {
    const response = await fetch(
        `https://api.pokemontcg.io/v2/cards?pageSize=${count}`,
        {
            headers: {
                "X-Api-Key": apiKey,
                Accept: "application/json",
            },
        }
    );
    const data = await response.json();
    return data.data || [];
}

async function displayTopViewedCards() {
    const topCards = await getTopViewedCards();

    const container = document.getElementById("trendingCardsContainer");
    container.innerHTML = "";

    for (const { cardId, count, fallback } of topCards) {
        // Fetch card details if not in memory
        const response = await fetch(
            `https://api.pokemontcg.io/v2/cards/${cardId}`,
            {
                headers: { "X-Api-Key": apiKey },
            }
        );
        const cardData = await response.json();

        // Render card
        const cardElement = document.createElement("div");
        cardElement.className = "top-card";
        cardElement.innerHTML = `
            <img src="${cardData.data.images.small}" alt="${cardData.data.name}" />
            <p>${cardData.data.name}</p>
        `;

        container.appendChild(cardElement);
    }
}

// Call this function on home page load
displayTopViewedCards();


// Ensure this script runs after both data loading and authentication state check.
window.onload = () => {
    onAuthStateChanged(auth, async (user) => {
        if (user) {
            await loadPortfolioData(user.uid); // Ensure portfolio data is fully loaded
            await updatePortfolioSummary(); // Update portfolio summary before updating chart

            // Now update the chart with "This Week" data after data has loaded
            updateChart("1W");
        } else {
            window.location.href = "login.html";
        }
    });
};


async function fetchTopCards() {
    try {
        const response = await fetch(`https://api.pokemontcg.io/v2/cards?q=set.name:"Surging Sparks"`, {
            headers: {
                'X-Api-Key': apiKey,
                'Accept': 'application/json',
            }
        });
        const data = await response.json();

        // Filter out cards without price data, then sort by highest price, and get top 10
        const cards = data.data
            .filter(card => card.cardmarket && card.cardmarket.prices && card.cardmarket.prices.averageSellPrice)
            .sort((a, b) => b.cardmarket.prices.averageSellPrice - a.cardmarket.prices.averageSellPrice)
            .slice(0, 8); // Get top 10

        displayTopCards(cards);
    } catch (error) {
        console.error('Error fetching top cards:', error);
    }
}

function displayTopCards(cards) {
    const topCardsContainer = document.getElementById('topCardsContainer');
    topCardsContainer.innerHTML = '';

    cards.forEach(card => {
        const todayPrice = card.cardmarket.prices.averageSellPrice || 0;
        const yesterdayPrice = card.cardmarket.prices.avg1 || todayPrice; // Default to today if no data

        // Calculate price change
        const priceChange = todayPrice - yesterdayPrice;
        const priceChangePercentage = ((priceChange / yesterdayPrice) * 100).toFixed(2);

        // Create a link element to make the card clickable
        const cardLink = document.createElement('a');
        cardLink.href = `card.html?id=${card.id}`;
        cardLink.className = 'top-card-entry';

        cardLink.innerHTML = `
            <img src="${card.images.small}" alt="${card.name}" class="top-card-image">
            <div class="top-card-details">
                <p><strong>${card.name}</strong></p>
                <p>Price: $${todayPrice.toFixed(2)}</p>
                <p class="${priceChange >= 0 ? 'green' : 'red'}">
                    ${priceChange >= 0 ? '▲' : '▼'} $${Math.abs(priceChange).toFixed(2)} (${priceChangePercentage}%)
                </p>
            </div>
        `;

        topCardsContainer.appendChild(cardLink);
    });
}

// Call the function to fetch and display the top 10 cards
fetchTopCards();