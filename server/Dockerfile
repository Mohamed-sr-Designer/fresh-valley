# Fresh Valley — API + static host
FROM node:20-bookworm-slim

# better-sqlite3 needs build tools only at install time
RUN apt-get update && apt-get install -y --no-install-recommends python3 make g++ \
  && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Install server deps first (better layer caching)
COPY server/package*.json ./server/
RUN cd server && npm install --omit=dev

# Copy the rest of the project (static site + server)
COPY . .

ENV NODE_ENV=production
ENV PORT=4000
EXPOSE 4000

# Persist the SQLite DB + uploads via a volume in production
VOLUME ["/app/server/data", "/app/server/uploads"]

WORKDIR /app/server
CMD ["node", "index.js"]
