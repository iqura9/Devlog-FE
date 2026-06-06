# syntax=docker/dockerfile:1

# ── Builder ───────────────────────────────────────────────────────────────────
FROM node:20-bookworm-slim AS builder
WORKDIR /app

COPY package*.json ./
RUN npm ci

# next.config rewrites() are evaluated at BUILD time and baked into the routes
# manifest, so the backend URL the /api/* proxy points at must be set here, not
# only at runtime. Defaults to the compose service address.
ARG BACKEND_URL=http://backend:4001
ENV BACKEND_URL=$BACKEND_URL

COPY . .
# Produces .next/standalone (self-contained server) + .next/static.
RUN npm run build

# ── Runner ────────────────────────────────────────────────────────────────────
FROM node:20-bookworm-slim AS runner
WORKDIR /app
ENV NODE_ENV=production
# Non-default port + bind to all interfaces so nginx/compose can reach it.
ENV PORT=4000
ENV HOSTNAME=0.0.0.0

# Standalone output: the traced server, plus static assets and public files.
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static

EXPOSE 4000
CMD ["node", "server.js"]
