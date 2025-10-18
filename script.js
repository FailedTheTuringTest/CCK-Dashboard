document.addEventListener('DOMContentLoaded', function () {
    // --- CONFIGURATION ---
    // ✅ IMPORTANT: PASTE YOUR NEW, FREE API KEY FROM ALPHA VANTAGE HERE
    const ALPHA_VANTAGE_API_KEY = 'KPWHMKBFE1SMAA35';

    const stockSymbols = ['AAPL', 'MSFT', 'AMZN', 'NVDA', 'GOOGL', 'TSLA', 'JPM', 'V', 'WMT'];
    
    // --- 1. CLOCK AND DATE ---
    function updateTime() {
        const timeEl = document.getElementById('time');
        const dateEl = document.getElementById('date');
        const now = new Date();
        const timeString = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        const dateString = now.toLocaleDateString([], { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
        timeEl.textContent = timeString;
        dateEl.textContent = dateString;
    }

    // --- 2. WEATHER ---
    async function fetchWeather(lat, lon, locationName) {
        const weatherUrl = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,weather_code,wind_speed_10m`;
        document.getElementById('weather-title').textContent = `Weather in ${locationName}`;
        try {
            const response = await fetch(weatherUrl);
            if (!response.ok) throw new Error('Network response was not ok');
            const data = await response.json();
            
            const weatherInfo = document.getElementById('weather-info');
            const temp = data.current.temperature_2m;
            const wind = data.current.wind_speed_10m;
            const weatherCode = data.current.weather_code;
            const weatherDescription = {
                0: 'Clear sky', 1: 'Mainly clear', 2: 'Partly cloudy', 3: 'Overcast', 45: 'Fog',
                61: 'Slight rain', 63: 'Moderate rain', 65: 'Heavy rain', 80: 'Slight showers'
            }[weatherCode] || 'Unknown';
            weatherInfo.innerHTML = `
                <div class="weather-item">Temperature: <span>${temp}°C</span></div>
                <div class="weather-item">Condition: <span>${weatherDescription}</span></div>
                <div class="weather-item">Wind Speed: <span>${wind} km/h</span></div>
            `;
        } catch (error) {
            console.error('Error fetching weather:', error);
            document.getElementById('weather-info').innerHTML = `<p class="error-message">Could not fetch weather data.</p>`;
        }
    }

    function getWeatherByLocation() {
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
                (position) => fetchWeather(position.coords.latitude, position.coords.longitude, 'Your Location'),
                // UPDATED: Fallback location is now Westmeath
                () => fetchWeather(53.5267, -7.3421, 'Westmeath')
            );
        } else {
            // UPDATED: Fallback location is now Westmeath
            fetchWeather(53.5267, -7.3421, 'Westmeath');
        }
    }

    // --- 3. NEWS (BBC NI) ---
    async function fetchNews() {
        const newsUrl = `https://api.rss2json.com/v1/api.json?rss_url=http%3A%2F%2Ffeeds.bbci.co.uk%2Fnews%2Fnorthern_ireland%2Frss.xml`;
        const newsInfo = document.getElementById('news-info');
        try {
            const response = await fetch(newsUrl);
            if (!response.ok) throw new Error('Network response was not ok');
            const data = await response.json();

            const newsItemsHtml = data.items.slice(0, 10).map(item => 
                `<a href="${item.link}" target="_blank">${item.title}</a>`
            ).join('<span class="news-separator">•</span>');
            
            const contentBlock = `<div class="ticker-items-wrapper">${newsItemsHtml}</div>`;
            newsInfo.innerHTML = contentBlock + contentBlock;

        } catch (error) {
            console.error('Error fetching news:', error);
            newsInfo.innerHTML = `<p class="error-message">Could not fetch news headlines.</p>`;
            newsInfo.classList.add('error');
        } finally {
            newsInfo.classList.remove('loading');
        }
    }

    // --- 4. STOCK PRICES (FIXED FOR RATE LIMITING) ---

    // Helper function to create a delay
    const delay = ms => new Promise(res => setTimeout(res, ms));

    async function fetchStocks() {
        const stockInfo = document.getElementById('stock-info');
        // Delay between API calls in milliseconds. Alpha Vantage free tier allows 5 calls/min,
        // so 15 seconds (15000ms) is a safe interval.
        const API_CALL_DELAY = 15000; 

        if (ALPHA_VANTAGE_API_KEY === '(api_key)' || !ALPHA_VANTAGE_API_KEY) {
            stockInfo.innerHTML = `<p class="error-message">IMPORTANT: Add your Alpha Vantage API key in the script to see stocks.</p>`;
            stockInfo.classList.add('error');
            stockInfo.classList.remove('loading');
            return;
        }
        
        // This array will hold the HTML for each stock item
        let stockItemsHtml = ''; 

        try {
            // Loop through each symbol sequentially instead of all at once
            for (const symbol of stockSymbols) {
                const url = `https://www.alphavantage.co/query?function=GLOBAL_QUOTE&symbol=${symbol}&apikey=${ALPHA_VANTAGE_API_KEY}`;
                const response = await fetch(url);
                if (!response.ok) {
                     // If a single fetch fails, log it but continue to the next one
                    console.error(`Error fetching data for ${symbol}: ${response.statusText}`);
                    continue; // Skip to the next symbol
                }
                
                const result = await response.json();
                
                // Check for API rate limit note in the response
                if (result.Note && result.Note.includes('API call frequency')) {
                    throw new Error('Alpha Vantage API rate limit reached. Please wait a minute and refresh.');
                }

                const quote = result['Global Quote'];
                // If the quote object is valid, build the HTML for it
                if (quote && Object.keys(quote).length > 0) {
                    const symbol = quote['01. symbol'];
                    const price = parseFloat(quote['05. price']).toFixed(2);
                    const change = parseFloat(quote['09. change']);
                    const changePercent = parseFloat(quote['10. change percent'].replace('%', '')).toFixed(2);
                    
                    const changeClass = change >= 0 ? 'stock-change-positive' : 'stock-change-negative';
                    
                    let arrow = '';
                    if (change > 0) arrow = '▲';
                    if (change < 0) arrow = '▼';
                    
                    stockItemsHtml += `<div class="stock-ticker-item">
                                            ${symbol}
                                            <span class="price">${price}
                                                <span class="${changeClass}">
                                                    ${arrow} ${Math.abs(changePercent)}%
                                                </span>
                                            </span>
                                        </div>`;
                }

                // Wait for the specified delay before the next iteration
                await delay(API_CALL_DELAY);
            }

            if (!stockItemsHtml) {
                 throw new Error("Could not retrieve data for any stocks. Check symbols or API key.");
            }

            // Once all stocks are fetched, update the DOM
            const contentBlock = `<div class="ticker-items-wrapper">${stockItemsHtml}</div>`;
            stockInfo.innerHTML = contentBlock + contentBlock; // Duplicate for seamless ticker effect

        } catch (error) {
            console.error('Error fetching stocks:', error);
            stockInfo.innerHTML = `<p class="error-message">${error.message}</p>`;
            stockInfo.classList.add('error');
        } finally {
            stockInfo.classList.remove('loading');
        }
    }


    // --- INITIALIZE ---
    updateTime();
    setInterval(updateTime, 1000);
    getWeatherByLocation();
    fetchNews();
    fetchStocks();
});
