from selenium import webdriver
from selenium.webdriver.firefox.options import Options
import threading
import time
import os
import json
from http.server import HTTPServer, SimpleHTTPRequestHandler
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Get API key from environment
API_KEY = os.getenv('API_KEY', '')

class ConfigHandler(SimpleHTTPRequestHandler):
    """Custom handler that serves static files and provides config endpoint"""
    
    def do_GET(self):
        # Handle API config endpoint
        if self.path == '/api/config':
            self.send_response(200)
            self.send_header('Content-type', 'application/json')
            self.end_headers()
            config = {'apiKey': API_KEY}
            self.wfile.write(json.dumps(config).encode())
            return
        
        # Serve static files for everything else
        super().do_GET()

def start_server():
    """Start HTTP server in a separate thread"""
    os.chdir(os.path.dirname(__file__))
    server = HTTPServer(('localhost', 5000), ConfigHandler)
    server.serve_forever()

# Start HTTP server in a background thread
server_thread = threading.Thread(target=start_server, daemon=True)
server_thread.start()

# Give server a moment to start
time.sleep(1)

# Configure Firefox options for fullscreen kiosk mode
firefox_options = Options()
firefox_options.add_argument("--kiosk")  # Start in fullscreen

# Point to the local server
website_url = "http://localhost:5000/index.html"

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
