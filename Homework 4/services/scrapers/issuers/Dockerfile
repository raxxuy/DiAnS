# Use Python 3.12 slim image as base
FROM python:3.12-slim

# Build arguments
ARG DB_HOST
ARG DB_DATABASE
ARG DB_USER
ARG DB_PASSWORD

# Set working directory
WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y \
    libpq-dev \
    cron \
    && rm -rf /var/lib/apt/lists/*

# Copy requirements and install Python dependencies
COPY issuers/requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy the scraper code
COPY issuers/ .
COPY shared/ ./shared/

# Create necessary directories and set permissions
RUN mkdir -p /var/run/crond /var/log/scraper
RUN touch /var/log/scraper/cron.log
RUN chmod 777 /var/run/crond /var/log/scraper/cron.log

# Create the cron job file
RUN echo "${SCRAPER_CRON_SCHEDULE:-0 0 * * *} /usr/local/bin/python /app/main.py >> /var/log/scraper/cron.log 2>&1" > /etc/cron.d/scraper-cron
RUN chmod 0644 /etc/cron.d/scraper-cron
RUN crontab /etc/cron.d/scraper-cron

# Create a startup script
RUN echo '#!/bin/bash\n\
export DB_HOST=${DB_HOST}\n\
export DB_DATABASE=${DB_DATABASE}\n\
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