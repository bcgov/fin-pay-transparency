FROM flyway/flyway:10-alpine

# Non-root user
RUN adduser -D app
USER app

# Copy migrations
COPY ./migrations /flyway/sql

# Startup
CMD ["info","migrate","info"]
