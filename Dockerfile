# Backend Dockerfile - Multi-stage build for NestJS application
# Stage 1: Build
FROM node:20-alpine AS builder

WORKDIR /app

# Accept DATABASE_URL as build argument
ARG DATABASE_URL=postgresql://postgres:postgres@localhost:5432/assetflow?schema=public

# Copy package files
COPY package.json package-lock.json ./

# Install all dependencies (including devDependencies for build)
RUN npm ci

# Install missing OAuth and config packages
RUN npm install @nestjs/config passport-google-oauth20 passport-microsoft && \
    npm install --save-dev @types/passport-google-oauth20 @types/passport-microsoft

# Copy source code
COPY . .

# Copy prisma schema for type generation
COPY prisma ./prisma

# Generate Prisma client with DATABASE_URL from build arg
RUN DATABASE_URL=$DATABASE_URL npx prisma generate

# Build the application
RUN npm run build

# Stage 2: Production
FROM node:20-alpine

WORKDIR /app

# Copy package files
COPY package.json package-lock.json ./

# Install all dependencies first
RUN npm ci

# Copy built application from builder stage
COPY --from=builder /app/dist ./dist

# Copy prisma schema and generated client
COPY prisma ./prisma
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma

# Expose port
EXPOSE 3001

# Health check
HEALTHCHECK --interval=10s --timeout=3s --start-period=5s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3001', (r) => {if (r.statusCode !== 200) throw new Error(r.statusCode)})"

# Run migrations, seed database, and start the application
CMD ["sh", "-c", "npx prisma migrate deploy && npx ts-node prisma/seed.ts && node dist/main"]
