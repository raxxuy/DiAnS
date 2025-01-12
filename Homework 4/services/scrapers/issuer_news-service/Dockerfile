# Use Python 3.12 slim image as base
FROM python:3.12-slim

# Build arguments
ARG DB_HOST
ARG DB_DATABASE
ARG DB_USER
ARG DB_PASSWORD

# Set working directory
WORKDIR /app

# Install system dependencies including cron
RUN apt-get update && apt-get install -y \
    gcc \
    python3-dev \
    libpq-dev \
    cron \
    && rm -rf /var/lib/apt/lists/*

# Copy requirements first to leverage Docker cache
COPY scrapers/issuer_news-service/requirements.txt .

# Install Python dependencies
RUN pip install --no-cache-dir -r requirements.txt

# Copy the scraper code
COPY scrapers/issuer_news-service/ .
COPY scrapers/shared/ ./shared/

# Create necessary directories and set permissions
RUN mkdir -p /var/run/crond /var/log/scraper
RUN touch /var/log/scraper/cron.log
RUN chmod 777 /var/run/crond /var/log/scraper/cron.log

# Create the cron job file using environment variable
RUN echo "${SCRAPER_CRON_SCHEDULE:-0 0 * * *} /usr/local/bin/python /app/main.py >> /var/log/scraper/cron.log 2>&1" > /etc/cron.d/scraper-cron

# Give execution rights to the cron job
RUN chmod 0644 /etc/cron.d/scraper-cron

# Apply the cron job
RUN crontab /etc/cron.d/scraper-cron

# Create a startup script that exports environment variables and handles completion flag
RUN echo '#!/bin/bash\n\
export DB_HOST=${DB_HOST}\n\
export DB_NAME=${DB_DATABASE}\n\
export DB_USER=${DB_USER}\n\
export DB_PASSWORD=${DB_PASSWORD}\n\
rm -f /app/scraping_complete\n\
cron -f & \n\
python main.py && touch /app/scraping_complete\n\
tail -f /var/log/scraper/cron.log' > /app/start.sh

# Make the startup script executable
RUN chmod +x /app/start.sh

# Run as root
CMD ["/app/start.sh"]