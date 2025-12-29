# JellyTube Monorepo

Stream YouTube content in Jellyfin without downloading videos.

## 📦 Packages

- **`@jellytube/app`**: Generates `.strm` and `.nfo` files for YouTube channels
- **`@jellytube/proxy`**: Resolves YouTube stream URLs on-the-fly

## 🚀 Quick Start

```bash
# Install dependencies
pnpm install

# Build all packages
pnpm build

# Run with Docker Compose
docker-compose up -d
```

## 📝 Configuration

Copy `.env.example` to `.env` and configure:

```ini
PROXY_URL=http://localhost:9000
CHANNELS=https://www.youtube.com/@channel1,https://www.youtube.com/@channel2
MAX_VIDEOS=50
SKIP_SHORTS=false
SKIP_LIVES=false
```

## 🏗️ Development

```bash
# Install dependencies
pnpm install

# Run all packages in dev mode
pnpm dev

# Lint all packages
pnpm lint

# Format all packages
pnpm format
```

## 📂 Project Structure

```
jellytube/
├── packages/
│   ├── app/          # Main application (TypeScript)
│   └── proxy/        # Streaming proxy (Node.js)
├── output/           # Generated .strm files
├── docker-compose.yml
└── pnpm-workspace.yaml
```

## 🐳 Docker

```bash
# Build and run
docker-compose up -d

# View logs
docker logs jellytube -f
docker logs jellytube-proxy -f

# Stop
docker-compose down
```

## 📖 How It Works

1. **App** scans YouTube channels and generates `.strm` files
2. **Jellyfin** reads `.strm` files and requests the URL
3. **Proxy** resolves the YouTube stream URL in real-time
4. **Jellyfin** streams the video directly from YouTube

## ⚙️ Features

- ✅ Zero storage (pure streaming)
- ✅ Automatic metadata (.nfo files)
- ✅ Thumbnail downloading
- ✅ Season organization by year
- ✅ Skip Shorts and Livestreams
- ✅ Configurable video limits

## 📄 License

MIT © Alex Saavedra
