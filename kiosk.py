from selenium import webdriver
from selenium.webdriver.firefox.options import Options
import time
import os

# Get the directory of this script
script_dir = os.path.dirname(os.path.abspath(__file__))

# Configure Firefox options for fullscreen kiosk mode
firefox_options = Options()
firefox_options.add_argument("--kiosk")  # Start in fullscreen

# Point to the local HTML file
website_url = f"file://{script_dir}/index.html"

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
