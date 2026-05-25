# Stage 1: Build stage
FROM node:20-alpine AS builder

WORKDIR /app

# Install pnpm and prisma globally
RUN npm install -g pnpm prisma

# Install dependencies first (for faster caching)
COPY package*.json ./

# Install dependencies with pnpm
RUN pnpm install

# Install @prisma/client explicitly
RUN pnpm add @prisma/client

# Copy all files including prisma directory
COPY . .

# Generate Prisma client with workspace root path
RUN npx prisma generate --schema=backend/prisma/schema.prisma

# Change to backend directory and build
WORKDIR /app/backend
RUN npm run build

# Stage 2: Production stage
FROM node:20-alpine

WORKDIR /app

# Copy production dependencies and built files from backend
COPY --from=builder /app/backend/package*.json ./
COPY --from=builder /app/backend/dist ./dist
COPY --from=builder /app/backend/node_modules ./node_modules
COPY --from=builder /app/backend/prisma ./prisma
COPY --from=builder /app/backend/src/generated ./src/generated

# Set environment variables
ENV NODE_ENV=production
ENV PORT=8080

EXPOSE 8080

# Start the application
CMD ["npm", "run", "start:prod"]