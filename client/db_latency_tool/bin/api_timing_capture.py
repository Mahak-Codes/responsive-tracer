from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.chrome.service import Service as ChromeService
from selenium.webdriver.firefox.service import Service as FirefoxService
from webdriver_manager.chrome import ChromeDriverManager
from webdriver_manager.firefox import GeckoDriverManager
from browsermobproxy import Server
from flask import Flask, request, jsonify, render_template
import json
import time
import os


app = Flask(__name__, template_folder='templates')

def start_proxy():
    """Start BrowserMob Proxy server."""
    server = Server("/home/adhero/Downloads/browsermob-proxy-2.1.4-bin/browsermob-proxy-2.1.4/bin")
    server.start()
    return server.create_proxy()

def setup_browser(proxy, browser_type):
    """Set up browser with proxy."""
    if browser_type.lower() == "firefox":
        firefox_options = webdriver.FirefoxOptions()
        firefox_options.add_argument(f'--proxy-server={proxy.proxy}')
        firefox_options.add_argument('--ignore-certificate-errors')
        driver = webdriver.Firefox(
            service=FirefoxService(GeckoDriverManager().install()),
            options=firefox_options
        )
    else:  # Default to Chrome
        chrome_options = webdriver.ChromeOptions()
        chrome_options.add_argument(f'--proxy-server={proxy.proxy}')
        chrome_options.add_argument('--ignore-certificate-errors')
        driver = webdriver.Chrome(
            service=ChromeService(ChromeDriverManager().install()),
            options=chrome_options
        )
    return driver

def capture_network_requests(proxy, url, button_selector, browser_type):
    """Capture XHR/fetch requests and return API timings."""
    proxy.new_har("capture", options={
        'captureHeaders': True,
        'captureContent': True
    })

    driver = setup_browser(proxy, browser_type)
    results = []
    
    try:
        driver.get(url)
        time.sleep(2)

        button = driver.find_element(By.CSS_SELECTOR, button_selector)
        button.click()
        time.sleep(3)

        har = proxy.har
        log_entries = har['log']['entries']

        api_requests = [
            entry for entry in log_entries
            if entry['request']['method'] in ['GET', 'POST']
            and ('xmlhttprequest' in entry['request'].get('headers', {}).get('X-Requested-With', '').lower()
                 or 'fetch' in entry['request'].get('headers', {}).get('Sec-Fetch-Mode', '').lower())
        ]

        for entry in api_requests:
            url = entry['request']['url']
            timing = entry['timings']
            total_time = timing['wait'] + timing['receive']
            results.append({
                'url': url,
                'total_time': total_time,
                'wait_time': timing['wait'],
                'receive_time': timing['receive']
            })

        return results

    finally:
        driver.quit()
        proxy.server.stop()

@app.route('/')
def index():
    return render_template("index.html")

@app.route('/capture', methods=['POST'])
def capture():
    data = request.json
    url = data.get('url')
    button_selector = data.get('button_selector')
    browser_type = data.get('browser_type', 'chrome')

    if not url or not button_selector:
        return jsonify({'error': 'URL and button selector are required'}), 400

    try:
        proxy = start_proxy()
        results = capture_network_requests(proxy, url, button_selector, browser_type)
        return jsonify({'results': results})
    except Exception as e:
        return jsonify({'error': str(e)}), 500

if __name__ == "__main__":
    app.run(debug=True, port=5000)