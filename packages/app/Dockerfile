# Stage 1: Build
FROM node:20-alpine AS builder

WORKDIR /app

# Install pnpm
RUN npm install -g pnpm

COPY package.json ./

# Remove prepare script to prevent husky from running during install
RUN npm pkg delete scripts.prepare

RUN pnpm install --prod

COPY tsconfig.json ./
COPY src ./src

# Install dev dependencies for build
RUN pnpm install

RUN pnpm run build

# Prune dev dependencies
RUN pnpm prune --prod

# Stage 2: Production
FROM node:20-alpine

# Install yt-dlp dependencies
RUN apk add --no-cache python3 py3-pip ffmpeg
# Install yt-dlp
RUN wget https://github.com/yt-dlp/yt-dlp/releases/latest/download/yt-dlp -O /usr/local/bin/yt-dlp \
    && chmod a+rx /usr/local/bin/yt-dlp

WORKDIR /app

COPY --from=builder /app/package*.json ./
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist

# Create output directory
RUN mkdir -p output && chown node:node output

USER node

ENV NODE_ENV=production

CMD ["node", "dist/main.js"]
