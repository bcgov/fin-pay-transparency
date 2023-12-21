FROM flyway/flyway:9.22-alpine

# Non-root user
RUN adduser -D app.ts
USER app

# Copy migrations
COPY ./migrations /flyway/sql

# Startup
CMD ["info","migrate","info"]
