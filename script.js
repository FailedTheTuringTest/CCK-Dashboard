document.addEventListener('DOMContentLoaded', function () {
    // --- CONFIGURATION ---
    // PASTE YOUR FREE API KEY FROM FINANCIAL MODELING PREP HERE
    const FMP_API_KEY = 'KLmIuCOPF2f04KtK7z1JFVu9HfVN3Pkn'; 
    
    // These are US-based stocks that work with the free FMP plan
    const stockSymbols = ['AAPL', 'GOOGL', 'MSFT', 'TSLA']; 
    
    // --- 1. CLOCK AND DATE ---
    function updateTime() {
        const timeEl = document.getElementById('time');
        const dateEl = document.getElementById('date');
        const now = new Date();
        const timeString = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
        const dateString = now.toLocaleDateString([], { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
        timeEl.textContent = timeString;
        dateEl.textContent = dateString;
    }

    // --- 2. WEATHER ---
    function fetchWeather(lat, lon, locationName) {
        const weatherUrl = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,weather_code,wind_speed_10m`;
        
        // UPDATE: Set title dynamically
        document.getElementById('weather-title').textContent = `Weather in ${locationName}`;

        fetch(weatherUrl)
            .then(response => response.json())
            .then(data => {
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
            })
            .catch(error => {
                console.error('Error fetching weather:', error);
                document.getElementById('weather-info').innerHTML = `<p>Could not fetch weather.</p>`;
            });
    }

    // UPDATED: Function now tries to get user's location first
    function getWeatherByLocation() {
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
                (position) => {
                    // Success: Fetch weather for user's location
                    fetchWeather(position.coords.latitude, position.coords.longitude, 'Your Location');
                },
                () => {
                    // Error/Denied: Fallback to Cork
                    fetchWeather(51.8985, -8.4756, 'Cork');
                }
            );
        } else {
            // Geolocation not supported: Fallback to Cork
            fetchWeather(51.8985, -8.4756, 'Cork');
        }
    }

    // --- 3. NEWS (BBC NI) ---
    function fetchNews() {
        const newsUrl = `https://api.rss2json.com/v1/api.json?rss_url=http%3A%2F%2Ffeeds.bbci.co.uk%2Fnews%2Fnorthern_ireland%2Frss.xml`;
        const newsInfo = document.getElementById('news-info');
        
        fetch(newsUrl)
            .then(response => response.json())
            .then(data => {
                // FIX: Create an array of links first
                const newsItems = data.items.slice(0, 10).map(item => 
                    `<a href="${item.link}" target="_blank">${item.title}</a>`
                );
                
                // FIX: Join the array with the separator to avoid an extra one at the end
                newsInfo.innerHTML = newsItems.join('<span class="news-separator">•</span>');
                
                // FIX: Remove the 'loading' class to start the scroll animation
                newsInfo.classList.remove('loading');
            })
            .catch(error => {
                console.error('Error fetching news:', error);
                newsInfo.innerHTML = `<p>Could not fetch news.</p>`;
                newsInfo.classList.remove('loading'); // Also remove on error
            });
    }

    // --- 4. STOCK PRICES ---
    function fetchStocks() {
        if (FMP_API_KEY === 'YOUR_API_KEY_HERE' || !FMP_API_KEY) {
            document.getElementById('stock-info').innerHTML = `<p>Please add your FMP API key.</p>`;
            return;
        }
        const stockUrl = `https://financialmodelingprep.com/api/v3/quote/${stockSymbols.join(',')}?apikey=${FMP_API_KEY}`;
        fetch(stockUrl)
            .then(response => {
                if (!response.ok) throw new Error(`Stock API response: ${response.status}`);
                return response.json();
            })
            .then(data => {
                const stockInfo = document.getElementById('stock-info');
                if (!data || data.length === 0) {
                    stockInfo.innerHTML = `<p>Could not fetch stock data. The API may have limitations on the selected tickers.</p>`;
                    return;
                }
                let html = '';
                data.forEach(stock => {
                    const change = stock.change.toFixed(2);
                    const changePercent = stock.changesPercentage.toFixed(2);
                    const changeClass = change >= 0 ? 'stock-change-positive' : 'stock-change-negative';
                    const sign = change >= 0 ? '+' : '';
                    html += `
                        <div class="stock-item">
                            <span>${stock.symbol}</span>
                            <span class="stock-price">${stock.price.toFixed(2)}
                                <span class="${changeClass}">(${sign}${changePercent}%)</span>
                            </span>
                        </div>
                    `;
                });
                stockInfo.innerHTML = html;
            })
            .catch(error => {
                console.error('Error fetching stocks:', error);
                document.getElementById('stock-info').innerHTML = `<p>Could not fetch stock data.</p>`;
            });
    }

    // --- INITIALIZE ---
    updateTime();
    setInterval(updateTime, 1000); // Update time every second
    getWeatherByLocation();
    fetchNews();
    fetchStocks();
});