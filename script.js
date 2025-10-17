document.addEventListener('DOMContentLoaded', function () {
    // --- CONFIGURATION ---
    const FMP_API_KEY = 'KLmIuCOPF2f04KtK7z1JFVu9HfVN3Pkn'; // <-- PASTE YOUR FREE API KEY HERE
    const stockSymbols = ['AAPL']; // Apple, Google, Microsoft, CRH (Irish)
    
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
    function fetchWeather(lat, lon) {
        const weatherUrl = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,weather_code,wind_speed_10m`;
        fetch(weatherUrl)
            .then(response => response.json())
            .then(data => {
                const weatherInfo = document.getElementById('weather-info');
                const temp = data.current.temperature_2m;
                const wind = data.current.wind_speed_10m;
                const weatherCode = data.current.weather_code;

                // Simple weather code to description mapping
                const weatherDescription = {
                    0: 'Clear sky', 1: 'Mainly clear', 2: 'Partly cloudy', 3: 'Overcast',
                    45: 'Fog', 48: 'Depositing rime fog', 51: 'Light drizzle', 53: 'Moderate drizzle', 55: 'Dense drizzle',
                    61: 'Slight rain', 63: 'Moderate rain', 65: 'Heavy rain',
                    80: 'Slight rain showers', 81: 'Moderate rain showers', 82: 'Violent rain showers'
                }[weatherCode] || 'Unknown';

                weatherInfo.innerHTML = `
                    <div class="weather-item">Location: <span>Your Area</span></div>
                    <div class="weather-item">Temperature: <span>${temp}°C</span></div>
                    <div class="weather-item">Condition: <span>${weatherDescription}</span></div>
                    <div class="weather-item">Wind Speed: <span>${wind} km/h</span></div>
                `;
            })
            .catch(error => {
                console.error('Error fetching weather:', error);
                document.getElementById('weather-info').innerHTML = `<p>Could not fetch weather data.</p>`;
            });
    }

    function getWeatherByLocation() {
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
                position => { // Success
                    fetchWeather(position.coords.latitude, position.coords.longitude);
                },
                () => { // Error or permission denied
                    // Default to Cork, Ireland if user denies location
                    fetchWeather(51.8985, -8.4756); 
                }
            );
        } else {
            // Default to Cork if geolocation is not supported
            fetchWeather(51.8985, -8.4756);
        }
    }

    // --- 3. NEWS (BBC NI) ---
    function fetchNews() {
        // We use a free RSS-to-JSON converter because of browser CORS security policies
        const newsUrl = `https://api.rss2json.com/v1/api.json?rss_url=http%3A%2F%2Ffeeds.bbci.co.uk%2Fnews%2Fnorthern_ireland%2Frss.xml`;
        fetch(newsUrl)
            .then(response => response.json())
            .then(data => {
                const newsInfo = document.getElementById('news-info');
                let html = '';
                // Get the first 5 articles
                data.items.slice(0, 5).forEach(item => {
                    html += `
                        <div class="news-item">
                            <a href="${item.link}" target="_blank">${item.title}</a>
                            <p>${new Date(item.pubDate).toLocaleDateString()}</p>
                        </div>`;
                });
                newsInfo.innerHTML = html;
            })
            .catch(error => {
                console.error('Error fetching news:', error);
                document.getElementById('news-info').innerHTML = `<p>Could not fetch news.</p>`;
            });
    }

    // --- 4. STOCK PRICES ---
    function fetchStocks() {
        if (FMP_API_KEY === 'YOUR_API_KEY_HERE' || !FMP_API_KEY) {
            document.getElementById('stock-info').innerHTML = `<p>Please add your FMP API key in script.js</p>`;
            return;
        }

        const stockUrl = `https://financialmodelingprep.com/api/v3/quote/${stockSymbols.join(',')}?apikey=${FMP_API_KEY}`;
        fetch(stockUrl)
            .then(response => response.json())
            .then(data => {
                const stockInfo = document.getElementById('stock-info');
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