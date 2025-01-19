# Use Python 3.10 slim image as base
FROM python:3.10-slim

# Build arguments
ARG DB_HOST
ARG DB_DATABASE
ARG DB_USER
ARG DB_PASSWORD

# Install system dependencies
RUN apt-get update && apt-get install -y \
    libpq-dev \
    cron \
    wget \
    build-essential \
    gcc \
    make \
    && rm -rf /var/lib/apt/lists/*

# Install TA-Lib
WORKDIR /tmp
RUN wget http://prdownloads.sourceforge.net/ta-lib/ta-lib-0.4.0-src.tar.gz && \
    tar -xzf ta-lib-0.4.0-src.tar.gz && \
    cd ta-lib/ && \
    ./configure && \
    make && \
    make install && \
    cd .. && \
    rm -rf ta-lib-0.4.0-src.tar.gz ta-lib/ && \
    ldconfig

# Set working directory
WORKDIR /app

# Install numpy first (required for TA-Lib)
RUN pip install --no-cache-dir numpy==1.23.5

# Install TA-Lib Python wrapper with specific version
RUN pip install --no-cache-dir ta-lib==0.4.24

# Copy requirements and install other Python dependencies
COPY technical/requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy the analyzer code
COPY technical/ .
COPY shared/ ./shared/

# Create necessary directories and set permissions
RUN mkdir -p /var/run/crond /var/log/analyzer && \
    touch /var/log/analyzer/cron.log && \
    chmod 777 /var/run/crond /var/log/analyzer/cron.log

# Create the cron job file
RUN echo "${ANALYZER_CRON_SCHEDULE:-0 0 * * *} /usr/local/bin/python /app/main.py >> /var/log/analyzer/cron.log 2>&1" > /etc/cron.d/analyzer-cron && \
    chmod 0644 /etc/cron.d/analyzer-cron && \
    crontab /etc/cron.d/analyzer-cron

# Create a startup script
RUN echo '#!/bin/bash\n\
export DB_HOST=${DB_HOST}\n\
export DB_DATABASE=${DB_DATABASE}\n\
export DB_USER=${DB_USER}\n\
export DB_PASSWORD=${DB_PASSWORD}\n\
rm -f /app/analysis_complete\n\
cron -f & \n\
python main.py && touch /app/analysis_complete\n\
tail -f /var/log/analyzer/cron.log' > /app/start.sh && \
chmod +x /app/start.sh

# Run as root
CMD ["/app/start.sh"]