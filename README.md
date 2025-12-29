# JellyTube

An ingestion microservice designed for Jellyfin/Plex that generates `.strm` and `.nfo` files, redirecting traffic to a Piped instance without downloading videos locally.

## Features

- **Real Zero-Storage**: Uses `yt-dlp` to fetch metadata and links without downloading video or audio.
- **High Quality Metadata**: Fetches full descriptions, actual air dates, and episode names.
- **Piped Integration**: `.strm` files point to your Piped instance.
- **Jellyfin Friendly**: `Season {Year}` folder structure and complete `.nfo` files.
- **Clean Architecture**: Separation of concerns (Domain, UseCases, Infrastructure).
- **Docker Ready**: Optimized Alpine-based image with `yt-dlp` pre-installed.

## Requirements

- Docker & Docker Compose (Recommended).
- Node.js 20+ and `pnpm` (For local development).
- A Piped instance (public or private).
- `yt-dlp` installed on the system (only for local execution without Docker).

## Configuration

Environment variables configure the behavior (see `.env.example`):

| Variable            | Description                              | Default               |
| ------------------- | ---------------------------------------- | --------------------- |
| `PIPED_URL`         | Piped instance URL                       | `https://piped.video` |
| `OUTPUT_DIR`        | Directory where files will be generated  | `./output`            |
| `CONCURRENCY_LIMIT` | Simultaneous metadata fetches            | `2`                   |
| `MAX_VIDEOS`        | Max recent videos to process per channel | `50`                  |
| `SKIP_SHORTS`       | Skip Shorts videos (`true`/`false`)      | `false`               |
| `SKIP_LIVES`        | Skip Livestreams (`true`/`false`)        | `false`               |
| `CHANNELS`          | Comma-separated list of channel URLs     | (Required)            |
| `LOG_LEVEL`         | Log level                                | `info`                |

## Docker Deployment (Production)

1.  Ensure you have the `docker-compose.yml` file and your `.env`.
2.  Run:
    ```bash
    docker-compose up -d
    ```
    This will use the official image `mralexandersaavedra/jellytube:latest`.

## Scheduled Execution

The container is configured with `restart: unless-stopped` by default, but since the application exits after synchronization, this will create a continuous loop.

To run it periodically (e.g., every night), it is recommended to use **Cron** on the host:

```bash
# Example: Run every day at 3:00 AM
0 3 * * * cd /path/to/jellytube && docker-compose up
```

## Local Development

1.  Install dependencies:
    ```bash
    pnpm install
    ```
2.  Configure `.env` (copy from `.env.example`).
3.  Available commands:
    - `pnpm dev`: Run in development mode.
    - `pnpm build`: Compile TypeScript to JavaScript.
    - `pnpm lint`: Run linter (ESLint).
    - `pnpm format`: Format code (Prettier).

## Technical Notes

- **Streaming**: The `.strm` file contains the URL `${PIPED_URL}/v1/streams/${videoId}`. Note that this URL returns a JSON with available streams. Jellyfin will need a specific plugin or configuration to interpret this, or Piped must support direct redirection (depends on instance and configuration).
