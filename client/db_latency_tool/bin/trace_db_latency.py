from selenium import webdriver
from selenium.webdriver.firefox.service import Service
from webdriver_manager.firefox import GeckoDriverManager

def open_firefox():
    driver = webdriver.Firefox(service=Service(GeckoDriverManager().install()))
    
    driver.get("https://www.google.com")
    
    import time
    time.sleep(5)
    
    driver.quit()

if __name__ == "__main__":
    open_firefox()