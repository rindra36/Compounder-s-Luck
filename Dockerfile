# Dockerfile for a Next.js application

# 1. Installer stage: Install dependencies
FROM node:20-slim AS deps
WORKDIR /app

# Copy package.json and install dependencies
COPY package.json ./
RUN npm install

# 2. Builder stage: Build the application
FROM node:20-slim AS builder
WORKDIR /app

# Copy dependencies from the previous stage
COPY --from=deps /app/node_modules ./node_modules
# Copy the rest of the application source code
COPY . .

# Build the Next.js application
RUN npm run build

# 3. Runner stage: Run the application
FROM node:20-slim AS runner
WORKDIR /app

ENV NODE_ENV=production

# Copy the built application and necessary files from the builder stage
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./package.json

# Expose the port the app will run on
EXPOSE 3000

# Command to start the application
CMD ["npm", "start"]
