FROM node:18-bullseye-slim AS build

# Install packages, build and keep only prod packages
WORKDIR /app
COPY *.json ./
COPY ./src ./src

RUN mkdir -p /puppeteer_downloads  && chmod 777 /puppeteer_downloads
ENV PUPPETEER_DOWNLOAD_PATH=/puppeteer_downloads

RUN npm ci && \
    npm run build

RUN mkdir -p /app/sessions
RUN echo $(ls -la /puppeteer_downloads)

FROM node:18-bullseye-slim AS dependencies

# Install packages, build and keep only prod packages
WORKDIR /app
COPY *.json ./

#RUN mkdir -p /puppeteer_cache  && chmod 777 /puppeteer_cache
#ENV PUPPETEER_CACHE_DIR=/puppeteer_cache
#ENV PUPPETEER_DOWNLOAD_PATH=/puppeteer_cache
#RUN npx puppeteer browsers install chrome

RUN npm ci --omit=dev --ignore-scripts
RUN echo $(ls -la /root/.cache)

# Deployment container
FROM gcr.io/distroless/nodejs:18

# Copy over app.ts
WORKDIR /app
COPY --from=dependencies /app/node_modules ./node_modules
COPY --from=build /app/node_modules/@prisma ./node_modules/@prisma
COPY --from=build /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=build /app/node_modules/prisma ./node_modules/prisma
COPY --from=build /app/dist ./dist
COPY --from=build /app/sessions ./sessions
COPY --from=build /puppeteer_downloads /.cache/puppeteer

# Port and health check
EXPOSE 3000
HEALTHCHECK --interval=30s --timeout=3s CMD curl -f http://localhost/:3000

# Non-privileged user
USER app

# Start up command with 250MB of heap size, each application needs to determine what is the best value. DONT use default as it is 4GB.
CMD ["--max-old-space-size=250", "/app/dist/server"]
