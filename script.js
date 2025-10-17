document.addEventListener('DOMContentLoaded', function () {
    // --- CONFIGURATION ---
    const FMP_API_KEY = 'KLmIuCOPF2f04KtK7z1JFVu9HfVN3Pkn'; 
    const stockSymbols = ['AAPL', 'GOOGL', 'MSFT', 'TSLA']; 
    
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
                () => fetchWeather(51.8985, -8.4756, 'Cork') // Fallback on error/denial
            );
        } else {
            fetchWeather(51.8985, -8.4756, 'Cork'); // Fallback if geolocation not supported
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

            const newsItems = data.items.slice(0, 10).map(item => 
                `<a href="${item.link}" target="_blank">${item.title}</a>`
            );
            newsInfo.innerHTML = newsItems.join('<span class="news-separator">•</span>');
        } catch (error) {
            console.error('Error fetching news:', error);
            newsInfo.innerHTML = `<p class="error-message">Could not fetch news headlines.</p>`;
            newsInfo.classList.add('error');
        } finally {
            newsInfo.classList.remove('loading');
        }
    }

    // --- 4. STOCK PRICES ---
    async function fetchStocks() {
        const stockInfo = document.getElementById('stock-info');
        if (FMP_API_KEY === 'KLmIuCOPF2f04KtK7z1JFVu9HfVN3Pkn' || !FMP_API_KEY) {
            stockInfo.innerHTML = `<p class="error-message">Please add your FMP API key in script.js</p>`;
            stockInfo.classList.add('error');
            stockInfo.classList.remove('loading');
            return;
        }
        
        const stockUrl = `https://financialmodelingprep.com/api/v3/quote/${stockSymbols.join(',')}?apikey=${FMP_API_KEY}`;
        try {
            const response = await fetch(stockUrl);
            if (!response.ok) throw new Error('Network response was not ok');
            const data = await response.json();

            // FMP API sometimes returns an error message object on success
            if (data['Error Message']) {
                throw new Error(data['Error Message']);
            }
            if (!data || data.length === 0) {
                 throw new Error("API returned no data for the selected symbols.");
            }
            
            const stockItems = data.map(stock => {
                const changePercent = stock.changesPercentage.toFixed(2);
                const changeClass = stock.change >= 0 ? 'stock-change-positive' : 'stock-change-negative';
                const sign = stock.change >= 0 ? '+' : '';
                return `<div class="stock-ticker-item">
                            ${stock.symbol}
                            <span class="price">${stock.price.toFixed(2)}
                                <span class="${changeClass}">(${sign}${changePercent}%)</span>
                            </span>
                        </div>`;
            });
            stockInfo.innerHTML = stockItems.join('');
        } catch (error) {
            console.error('Error fetching stocks:', error);
            stockInfo.innerHTML = `<p class="error-message">Stock data unavailable. The free API may be down or has reached its limit.</p>`;
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