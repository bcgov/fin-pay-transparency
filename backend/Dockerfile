FROM node:22-bullseye-slim AS build

# Install packages, build and keep only prod packages
WORKDIR /app
COPY *.json ./
COPY ./src ./src
RUN npm ci --ignore-scripts && \
    npm run build

RUN mkdir -p /app/sessions

FROM node:22-bullseye-slim AS dependencies

# Install packages, build and keep only prod packages
WORKDIR /app
COPY *.json ./
RUN npm ci --omit=dev --ignore-scripts


# Deployment container
FROM node:22-bullseye-slim
ENV NODE_ENV=production
# Copy over app.ts
WORKDIR /app
COPY --from=dependencies /app/node_modules ./node_modules
COPY --from=build /app/dist ./dist
COPY --from=build /app/sessions ./sessions

RUN npm install -g clinic

# Copy entrypoint script with proper line endings
COPY docker-entrypoint.sh /usr/local/bin/
RUN chmod +x /usr/local/bin/docker-entrypoint.sh && \
    dos2unix /usr/local/bin/docker-entrypoint.sh || sed -i 's/\r$//' /usr/local/bin/docker-entrypoint.sh

# Port and health check
EXPOSE 3000
#HEALTHCHECK --interval=30s --timeout=3s CMD curl -f http://localhost/:3000

# Add aliases to .bashrc
RUN echo "alias ll='ls -alh'" >> ~/.bashrc

RUN apt-get update \
 && apt-get install -y --no-install-recommends procps \
 && rm -rf /var/lib/apt/lists/*

# Create /.config directory and make it writable for clinic insight
RUN mkdir -p /.config && chmod 777 /.config

# Create .clinic directory for clinic heap profiler data
RUN mkdir -p /app/.clinic && chmod 777 /app/.clinic

# Entrypoint settings
ENV SERVER_MODE=clinic
ENV CLINIC_OPTION=heapprofiler
ENV CLINIC_INTERVAL=10
ENV NO_INSIGHT=true

# Non-privileged user
USER app

# Use entrypoint script to handle different startup modes
ENTRYPOINT ["/usr/local/bin/docker-entrypoint.sh"]

# Start up command with 250MB of heap size, each application needs to determine what is the best value. DONT use default as it is 4GB.
# CMD ["--max-old-space-size=250", "/app/dist/server"]
# CMD ["sh", "-c", "clinic heapprofiler --collect-only -- node --max-old-space-size=250 /app/dist/server.js; sleep 120"]

