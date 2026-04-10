# ── Stage 1: Build ────────────────────────────────────────────────
FROM node:20-alpine AS builder

WORKDIR /app

# Copy dependency files first (better layer caching)
COPY package*.json ./
RUN npm install

# Copy source and build
COPY . .
RUN npm run build

# ── Stage 2: Serve ────────────────────────────────────────────────
FROM node:20-alpine AS runner

WORKDIR /app

COPY package*.json ./
RUN npm install --omit=dev

# Copy built output from stage 1
COPY --from=builder /app/dist ./dist

EXPOSE 8080

# vite preview serves the production build
CMD ["npx", "vite", "preview", "--host", "0.0.0.0", "--port", "8080"]
