from selenium import webdriver
from selenium.webdriver.firefox.options import Options
import time

# Configure Firefox options for fullscreen kiosk mode
firefox_options = Options()
firefox_options.add_argument("--kiosk")  # Start in fullscreen

# Specify the website you want to open
website_url = "https://failedtheturingtest.github.io/CCK-Dashboard/"  # Replace with your desired URL

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
