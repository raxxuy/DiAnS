# Web scraping the Macedonian Stock Exchange
For this homework project, we developed a web scraper in Python to extract real-time stock data from the Macedonian Stock Exchange website. Using asynchronous programming with aiohttp and BeautifulSoup, the scraper retrieves company details and historical stock data directly from MSE’s public pages. Collected data is stored in a PostgreSQL database, making it accessible for financial analysis and insights.

# Prerequisites
- Python 3.8 or higher
- PostgreSQL (local or Docker-based)
- Docker (if using Docker to run the database)

# Setup
1. Clone the repository
    ```shell
    git clone https://github.com/raxxuy/DiAnS.git
    cd "DiAnS/Homework 1"
    ```
2. Install dependencies
    ```shell
    pip install -r requirements.txt
    ```
   
# Running the Project
1. Run Docker Compose
   ```shell
   docker compose up -d --build
   ```
2. Run main.py
   ```shell
   python src/main.py
   ```