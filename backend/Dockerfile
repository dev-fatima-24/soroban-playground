# Stage 1: Build stage
FROM node:20-alpine AS builder

WORKDIR /app

# Install pnpm
RUN npm install -g pnpm

# Install dependencies first (for faster caching)
COPY package*.json ./

# Install dependencies with pnpm
RUN pnpm install

# Copy prisma directory explicitly
COPY prisma ./prisma/

# Generate Prisma client with relative schema path
RUN npx prisma generate --schema=./prisma/schema.prisma

# Copy source code
COPY . .

# Build TypeScript to JavaScript
RUN npm run build

# Stage 2: Production stage
FROM node:20-alpine

WORKDIR /app

# Copy production dependencies and built files
COPY --from=builder /app/package*.json ./
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/src/generated ./src/generated

# Set environment variables
ENV NODE_ENV=production
ENV PORT=8080

EXPOSE 8080

# Start the application
CMD ["npm", "run", "start:prod"]