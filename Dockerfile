# Backend Dockerfile - Multi-stage build for NestJS application
# Stage 1: Build
FROM node:20-alpine AS builder

WORKDIR /app

# Accept DATABASE_URL as build argument
ARG DATABASE_URL=postgresql://postgres:postgres@localhost:5432/assetflow?schema=public

# Copy package files
COPY package.json package-lock.json ./

# Install all dependencies (including devDependencies for build)
RUN npm ci --fetch-retries=5 --fetch-retry-mintimeout=20000 --fetch-retry-maxtimeout=120000

# Install missing OAuth, config and type packages
RUN npm install @nestjs/config passport-google-oauth20 passport-microsoft && \
    npm install --save-dev @types/passport-google-oauth20 @types/passport-microsoft @types/bcrypt

# Copy source code
COPY . .

# Copy prisma schema for type generation
COPY prisma ./prisma

# Generate Prisma client with DATABASE_URL from build arg
RUN DATABASE_URL=$DATABASE_URL npx prisma generate

# Build the NestJS application (remove stale incremental cache first)
RUN rm -f tsconfig.tsbuildinfo && npm run build

# Verify the build succeeded - fail fast if main.js is missing
RUN ls -la /app/dist/ && \
    test -f /app/dist/main.js || (echo "ERROR: dist/main.js not found! Build failed." && exit 1)

# Compile the seed script to plain JS using CommonJS (avoids ts-node NodeNext issues at runtime)
RUN npx tsc prisma/seed.ts \
    --outDir /app/seed-dist \
    --module commonjs \
    --moduleResolution node \
    --esModuleInterop true \
    --skipLibCheck true \
    --target ES2020 \
    || true

# Stage 2: Production
FROM node:20-alpine

WORKDIR /app

# Copy package files
COPY package.json package-lock.json ./

# Install production dependencies only
RUN npm ci --omit=dev --fetch-retries=5 --fetch-retry-mintimeout=20000 --fetch-retry-maxtimeout=120000

# Re-install runtime extras needed (not in devDeps)
RUN npm install @nestjs/config passport-google-oauth20 passport-microsoft

# Copy built application from builder stage
COPY --from=builder /app/dist ./dist

# Copy compiled seed script
COPY --from=builder /app/seed-dist ./seed-dist

# Copy prisma schema and generated client
COPY prisma ./prisma
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=builder /app/node_modules/@prisma ./node_modules/@prisma

# Expose port
EXPOSE 3001

# Health check
HEALTHCHECK --interval=10s --timeout=3s --start-period=5s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3001', (r) => {if (r.statusCode !== 200) throw new Error(r.statusCode)})"

# Run migrations, seed database (as plain JS), and start the application
CMD ["sh", "-c", "npx prisma migrate deploy && node seed-dist/seed.js && node /app/dist/main.js"]

