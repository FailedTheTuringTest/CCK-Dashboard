from selenium import webdriver
from selenium.webdriver.chrome.service import Service
from webdriver_manager.chrome import ChromeDriverManager
from selenium.webdriver.chrome.options import Options
import time

# Configure Chrome options for fullscreen kiosk mode
chrome_options = Options()
chrome_options.add_argument("--kiosk")  # Start in fullscreen
chrome_options.add_argument("--incognito")  # Optional: incognito mode
chrome_options.add_argument("--disable-infobars")  # Disable infobars
chrome_options.add_argument("--noerrdialogs")  # Disable error dialogs
chrome_options.add_argument("--disable-notifications")  # Disable notifications

# Specify the website you want to open
website_url = "https://failedtheturingtest.github.io/CCK-Dashboard/"  # Replace with your desired URL

# Initialize the WebDriver
driver = webdriver.Chrome(
    service=Service(ChromeDriverManager().install()),
    options=chrome_options
)

# Open the website
driver.get(website_url)

# Keep the browser open
try:
    while True:
        time.sleep(10)  # Keep the script running
except KeyboardInterrupt:
    driver.quit()
