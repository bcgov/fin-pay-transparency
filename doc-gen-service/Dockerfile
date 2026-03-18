FROM node:22-slim

WORKDIR /app

# Install Chromium + dependencies
RUN apt-get update && apt-get install -y \
    chromium \
    fonts-liberation \
    libnss3 \
    libatk-bridge2.0-0 \
    libx11-xcb1 \
    libxcomposite1 \
    libxdamage1 \
    libxrandr2 \
    libgbm1 \
    libgtk-3-0 \
    libasound2 \
    libxshmfence1 \
    ca-certificates \
    wget \
    --no-install-recommends \
  && rm -rf /var/lib/apt/lists/*
# Install packages, build and keep only prod packages

COPY *.json ./
COPY ./src ./src

RUN mkdir -p /puppeteer_downloads  && chmod 777 /puppeteer_downloads
ENV PUPPETEER_DOWNLOAD_PATH=/puppeteer_downloads

RUN npm ci && \
    npm run build

ENV PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium

# Port and health check
EXPOSE 3001
HEALTHCHECK --interval=30s --timeout=3s CMD curl -f http://localhost/:3001

USER 1001

# Start up command with 150MB of heap size, each application needs to determine what is the best value. DONT use default as it is 4GB.
CMD ["--max-old-space-size=150", "/app/dist/server"]
