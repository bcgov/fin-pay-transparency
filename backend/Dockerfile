FROM node:20-alpine

# Install packages, build and keep only prod packages
WORKDIR /app
COPY *.json ./
COPY ./src ./src

RUN mkdir -p /puppeteer_downloads  && chmod 777 /puppeteer_downloads
ENV PUPPETEER_DOWNLOAD_PATH=/puppeteer_downloads

RUN npm ci && \
    npm run build

RUN mkdir -p /app/sessions

# Install chromium and its dependencies.  This is needed
# to support Puppeteer
RUN apk add --no-cache \
      chromium \
      nss \
      freetype \
      harfbuzz \
      ca-certificates \
      ttf-freefont 
     
#ENV PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium-browser

# Port and health check
EXPOSE 3000 
HEALTHCHECK --interval=30s --timeout=3s CMD curl -f http://localhost/:3000

# Non-privileged user
USER app

# Start up command with 250MB of heap size, each application needs to determine what is the best value. DONT use default as it is 4GB.
CMD ["--max-old-space-size=250", "/app/dist/server"]
