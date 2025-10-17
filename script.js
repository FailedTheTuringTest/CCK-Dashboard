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

    // --- 4. STOCK PRICES (REBUILT FOR ALPHA VANTAGE) ---
    async function fetchStocks() {
        const stockInfo = document.getElementById('stock-info');
        
        if (ALPHA_VANTAGE_API_KEY === 'YOUR_API_KEY_HERE' || !ALPHA_VANTAGE_API_KEY) {
            stockInfo.innerHTML = `<p class="error-message">IMPORTANT: Add your Alpha Vantage API key in script.js to see stocks.</p>`;
            stockInfo.classList.add('error');
            stockInfo.classList.remove('loading');
            return;
        }
        
        try {
            const requests = stockSymbols.map(symbol => {
                const url = `https://www.alphavantage.co/query?function=GLOBAL_QUOTE&symbol=${symbol}&apikey=${ALPHA_VANTAGE_API_KEY}`;
                return fetch(url).then(response => response.json());
            });

            const results = await Promise.all(requests);

            const rateLimitNote = results.find(res => res.Note && res.Note.includes('API call frequency'));
            if (rateLimitNote) {
                throw new Error('Alpha Vantage API limit reached. Please wait a minute.');
            }
            
            const stockItemsHtml = results.map(result => {
                const quote = result['Global Quote'];
                if (!quote || Object.keys(quote).length === 0) {
                    return ''; 
                }

                const symbol = quote['01. symbol'];
                const price = parseFloat(quote['05. price']).toFixed(2);
                const change = parseFloat(quote['09. change']);
                const changePercent = parseFloat(quote['10. change percent'].replace('%', '')).toFixed(2);
                
                const changeClass = change >= 0 ? 'stock-change-positive' : 'stock-change-negative';
                
                let arrow = '';
                if (change > 0) arrow = '▲';
                if (change < 0) arrow = '▼';
                
                return `<div class="stock-ticker-item">
                            ${symbol}
                            <span class="price">${price}
                                <span class="${changeClass}">
                                    ${arrow} ${Math.abs(changePercent)}%
                                </span>
                            </span>
                        </div>`;
            }).join('');

            if (!stockItemsHtml) {
                 throw new Error("Could not retrieve data for any stocks.");
            }

            const contentBlock = `<div class="ticker-items-wrapper">${stockItemsHtml}</div>`;
            stockInfo.innerHTML = contentBlock + contentBlock;

        } catch (error) {
            console.error('Error fetching stocks:', error);
            stockInfo.innerHTML = `<p class="error-message">Stock data unavailable. Check API key or wait if rate limit was reached.</p>`;
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
