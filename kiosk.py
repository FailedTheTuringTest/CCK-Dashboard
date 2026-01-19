from flask import Flask, jsonify
from selenium import webdriver
from selenium.webdriver.firefox.options import Options
import threading
import time
import os
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Initialize Flask app
app = Flask(__name__)

# API endpoint to serve the Alpha Vantage API key
@app.route('/api/config')
def get_config():
    return jsonify({
        'apiKey': os.getenv('ALPHA_VANTAGE_API_KEY', '')
    })

def start_flask():
    """Start Flask server in a separate thread"""
    app.run(host='localhost', port=5000, debug=False, use_reloader=False)

# Start Flask in a background thread
flask_thread = threading.Thread(target=start_flask, daemon=True)
flask_thread.start()

# Give Flask a moment to start
time.sleep(1)

# Configure Firefox options for fullscreen kiosk mode
firefox_options = Options()
firefox_options.add_argument("--kiosk")  # Start in fullscreen

# Specify the website you want to open
website_url = "http://localhost:5000"  # Point to local Flask server

# Initialize the WebDriver for Firefox
driver = webdriver.Firefox(options=firefox_options)

# Open the website
driver.get(website_url)

# Keep the browser open
try:
    while True:
        time.sleep(10)  # Keep the script running
except KeyboardInterrupt:
    driver.quit()
