#!/usr/bin/env python3
import os
import json
import sys
from dotenv import load_dotenv
from http.server import HTTPServer, SimpleHTTPRequestHandler
import urllib.request
import threading
import time

# Load environment variables
dotenv_path = os.path.join(os.path.dirname(__file__), '.env')
load_dotenv(dotenv_path)

# Get API key from environment
API_KEY = os.getenv('API_KEY', '')
print(f"✓ API Key loaded from .env: {API_KEY[:10]}..." if API_KEY else "✗ API_KEY not found in .env")

class ConfigHandler(SimpleHTTPRequestHandler):
    def do_GET(self):
        if self.path == '/api/config':
            self.send_response(200)
            self.send_header('Content-type', 'application/json')
            self.send_header('Access-Control-Allow-Origin', '*')
            self.end_headers()
            config = {'apiKey': API_KEY}
            self.wfile.write(json.dumps(config).encode())
            return
        super().do_GET()
    
    def log_message(self, format, *args):
        pass

# Start server
os.chdir(os.path.dirname(__file__))
server = HTTPServer(('localhost', 5000), ConfigHandler)

def run_server():
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        server.shutdown()

t = threading.Thread(target=run_server, daemon=True)
t.start()
time.sleep(0.5)

# Test the endpoint
try:
    response = urllib.request.urlopen('http://localhost:5000/api/config', timeout=2)
    data = json.loads(response.read().decode())
    print(f"✓ Config endpoint works!")
    print(f"✓ API Key from endpoint: {data['apiKey'][:10]}...")
    print("\nSetup is working correctly! You can now run kiosk.py")
except Exception as e:
    print(f"✗ Error testing endpoint: {e}")
    sys.exit(1)

server.shutdown()
