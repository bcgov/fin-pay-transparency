FROM node:22-bullseye-slim AS build

# Install packages, build and keep only prod packages
WORKDIR /app
COPY *.json ./
COPY ./src ./src
RUN npm ci --ignore-scripts && \
    npm run build


FROM node:22-bullseye-slim AS dependencies

# Install packages, build and keep only prod packages
WORKDIR /app
COPY *.json ./
RUN npm ci --omit=dev --ignore-scripts


# Deployment container
FROM gcr.io/distroless/nodejs22-debian12:nonroot
ENV NODE_ENV=production
# Copy over app.ts
WORKDIR /app
COPY --from=dependencies /app/node_modules ./node_modules
COPY --from=build /app/dist ./dist

# Port and health check
EXPOSE 3000
HEALTHCHECK --interval=30s --timeout=3s CMD curl -f http://localhost/:3000

# Non-privileged user
USER app

# Start up command with 100MB of heap size, each application needs to determine what is the best value. DONT use default as it is 4GB.
CMD ["--max-old-space-size=150", "/app/dist/server"]
