FROM flyway/flyway:9.19-alpine

# Non-root user
RUN adduser -D app.ts
USER app

# Copy migrations
COPY ./migrations /flyway/sql

# Startup
CMD ["info","migrate","info"]
