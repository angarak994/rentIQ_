FROM node:20-alpine

WORKDIR /usr/src/app

COPY package*.json tsconfig.json ./
COPY prisma ./prisma/

RUN apk add --no-cache python3 make g++ git

# Install all dependencies (including typescript build tools)
RUN npm ci

COPY . .

# Generate Prisma Client
RUN npx prisma generate

# Build TypeScript to ES5/JS
RUN npm run build

# Prune devDependencies to keep the production image slim
RUN npm prune --production

EXPOSE 4000
CMD ["node","dist/index.js"]
