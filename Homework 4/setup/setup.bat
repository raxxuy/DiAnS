@echo off
setlocal enabledelayedexpansion

echo Starting setup...

:: Start docker containers
echo Starting docker containers...
docker compose up -d --build

:: Wait for docker containers to start
echo Waiting for docker containers to start...
timeout /t 10 /nobreak

:: Create and activate virtual environment
echo Setting up Python virtual environment...
python -m venv venv

:: Activate virtual environment
echo Activating virtual environment...
call venv\Scripts\activate.bat

:: Install dependencies
echo Installing requirements...
pip install --upgrade pip
pip install -r requirements.txt

:: Run scrapers
echo Running issuer scraper...
python scraper\issuer\main.py

echo Running news scraper...
python scraper\news\main.py

echo Running issuer news scraper...
python scraper\issuer_news\main.py

::Run analysis
echo Running sentiment analysis...
python analysis\sentiment.py

echo Running LSTM predictions...
python analysis\lstm.py

echo Setup complete!