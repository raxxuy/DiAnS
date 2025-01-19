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
COPY lstm/requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy the analyzer code
COPY lstm/ .
COPY shared/ ./shared/

# Create necessary directories and set permissions
RUN mkdir -p /var/run/crond /var/log/analyzer
RUN touch /var/log/analyzer/cron.log
RUN chmod 777 /var/run/crond /var/log/analyzer/cron.log

# Create the cron job file
RUN echo "${ANALYZER_CRON_SCHEDULE:-0 0 * * *} /usr/local/bin/python /app/main.py >> /var/log/analyzer/cron.log 2>&1" > /etc/cron.d/analyzer-cron
RUN chmod 0644 /etc/cron.d/analyzer-cron
RUN crontab /etc/cron.d/analyzer-cron

# Create a startup script
RUN echo '#!/bin/bash\n\
export DB_HOST=${DB_HOST}\n\
export DB_DATABASE=${DB_DATABASE}\n\
export DB_USER=${DB_USER}\n\
export DB_PASSWORD=${DB_PASSWORD}\n\
rm -f /app/analysis_complete\n\
cron -f & \n\
python main.py && touch /app/analysis_complete\n\
tail -f /var/log/analyzer/cron.log' > /app/start.sh

# Make the startup script executable
RUN chmod +x /app/start.sh

# Run as root
CMD ["/app/start.sh"]