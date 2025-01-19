FROM node:22-slim

WORKDIR /app

# Install OpenSSL 1.1.x
RUN apt-get update && apt-get install -y openssl && apt-get install -y curl && rm -rf /var/lib/apt/lists/*

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy TypeScript config
COPY tsconfig.json ./

# Copy Prisma schema
COPY prisma ./prisma/

# Generate Prisma client
RUN npx prisma generate

# Copy source code
COPY src ./src

# Build TypeScript code
RUN npm run build

EXPOSE 5000

CMD ["npm", "start"] 