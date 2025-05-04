# Stage 1: Install dependencies
FROM node:20-alpine AS deps
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci

# Stage 2: Build the app
FROM node:20-alpine AS builder
WORKDIR /app

# Add build arguments
ARG SKIP_LINT=false
ARG SKIP_TYPE_CHECK=false
ARG NEXT_TELEMETRY_DISABLED=1

# Set environment variables for build time
ENV NEXT_TELEMETRY_DISABLED=$NEXT_TELEMETRY_DISABLED
ENV NODE_ENV=production
ENV NEXT_SHARP_PATH=/tmp/node_modules/sharp
ENV SKIP_LINT=$SKIP_LINT
ENV SKIP_TYPE_CHECK=$SKIP_TYPE_CHECK

# Copy the source and installed dependencies
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Build Next.js app
RUN npm run build

# Debug: Verify .next/standalone exists
RUN ls -la .next && ls -la .next/standalone

# Stage 3: Prepare production image
FROM node:20-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV PORT=8080
ENV HOSTNAME="0.0.0.0"
ENV NEXT_TELEMETRY_DISABLED=1

# Create non-root user
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nextjs

# Copy the standalone server and required files
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static
COPY --from=builder --chown=nextjs:nodejs /app/public ./public

# Set permissions
RUN chown -R nextjs:nodejs .

USER nextjs

EXPOSE 8080

HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:8080/api/health || exit 1

# Start the app using the standalone server
CMD ["node", "server.js"]