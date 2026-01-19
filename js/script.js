document.addEventListener('DOMContentLoaded', async function () {
    // --- CONFIGURATION ---
    let ALPHA_VANTAGE_API_KEY = '';
    const stockSymbols = ['AAPL', 'MSFT', 'AMZN', 'NVDA', 'GOOGL', 'TSLA', 'JPM', 'V', 'WMT'];

    // Load API key from backend
    async function loadConfig() {
        try {
            const response = await fetch('/api/config');
            const config = await response.json();
            ALPHA_VANTAGE_API_KEY = config.apiKey;
        } catch (error) {
            console.warn('Could not load config from backend:', error);
        }
    }

    await loadConfig();

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
                () => fetchWeather(53.5267, -7.3421, 'Westmeath')
            );
        } else {
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

    // --- 4. STOCK PRICES (RESTRICTED TO 8:55 AM - 4:05 PM) ---
    // Helper function to create a delay
    const delay = ms => new Promise(res => setTimeout(res, ms));

    // Check if current time is within the allowed window
    function isWithinAllowedHours() {
        const now = new Date();
        const hours = now.getHours();
        const minutes = now.getMinutes();
        const startHour = 8;
        const startMinute = 55;
        const endHour = 16;
        const endMinute = 5;

        if (hours > startHour || (hours === startHour && minutes >= startMinute)) {
            if (hours < endHour || (hours === endHour && minutes <= endMinute)) {
                return true;
            }
        }
        return false;
    }

    async function fetchStocks() {
        const stockInfo = document.getElementById('stock-info');
        const API_CALL_DELAY = 15000; // 15 seconds between calls (5 calls/min)

        if (!isWithinAllowedHours()) {
            stockInfo.innerHTML = `<p class="info-message">Stock data is only updated between 8:55 AM and 4:05 PM.</p>`;
            stockInfo.classList.remove('loading');
            return;
        }

        if (ALPHA_VANTAGE_API_KEY === '(api_key)' || !ALPHA_VANTAGE_API_KEY) {
            stockInfo.innerHTML = `<p class="error-message">IMPORTANT: Add your Alpha Vantage API key in the script to see stocks.</p>`;
            stockInfo.classList.add('error');
            stockInfo.classList.remove('loading');
            return;
        }

        let stockItemsHtml = '';
        try {
            for (const symbol of stockSymbols) {
                const url = `https://www.alphavantage.co/query?function=GLOBAL_QUOTE&symbol=${symbol}&apikey=${ALPHA_VANTAGE_API_KEY}`;
                const response = await fetch(url);
                if (!response.ok) {
                    console.error(`Error fetching data for ${symbol}: ${response.statusText}`);
                    continue;
                }

                const result = await response.json();
                if (result.Note && result.Note.includes('API call frequency')) {
                    throw new Error('Alpha Vantage API rate limit reached. Please wait a minute and refresh.');
                }

                const quote = result['Global Quote'];
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
                await delay(API_CALL_DELAY);
            }

            if (!stockItemsHtml) {
                throw new Error("Could not retrieve data for any stocks. Check symbols or API key.");
            }

            const contentBlock = `<div class="ticker-items-wrapper">${stockItemsHtml}</div>`;
            stockInfo.innerHTML = contentBlock + contentBlock;
        } catch (error) {
            console.error('Error fetching stocks:', error);
            stockInfo.innerHTML = `<p class="error-message">${error.message}</p>`;
            stockInfo.classList.add('error');
        } finally {
            stockInfo.classList.remove('loading');
        }
    }

    // --- INITIALIZE AND SET UP STOCK REFRESH ---
    updateTime();
    setInterval(updateTime, 1000);
    getWeatherByLocation();
    fetchNews();
    fetchStocks();

    // Refresh stocks every 15 minutes during allowed hours
    setInterval(() => {
        if (isWithinAllowedHours()) {
            fetchStocks();
        }
    }, 900000); // 15 minutes in milliseconds
});
