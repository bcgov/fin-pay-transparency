FROM node:20-alpine
WORKDIR /app
# Install chromium and its dependencies.  This is needed
# to support Puppeteer
RUN apk add --no-cache \
      chromium \
      nss \
      freetype \
      harfbuzz \
      ca-certificates \
      ttf-freefont
# Install packages, build and keep only prod packages

COPY *.json ./
COPY ./src ./src

RUN mkdir -p /puppeteer_downloads  && chmod 777 /puppeteer_downloads
ENV PUPPETEER_DOWNLOAD_PATH=/puppeteer_downloads

RUN npm ci && \
    npm run build




ENV PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium-browser

# Port and health check
EXPOSE 3001
HEALTHCHECK --interval=30s --timeout=3s CMD curl -f http://localhost/:3001

USER 1001

# Start up command with 150MB of heap size, each application needs to determine what is the best value. DONT use default as it is 4GB.
CMD ["--max-old-space-size=150", "/app/dist/server"]
