import express from 'express';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);
const app = express();
const PORT = 3000;

app.get('/stream/:videoId', async (req, res) => {
  const { videoId } = req.params;
  const youtubeUrl = `https://www.youtube.com/watch?v=${videoId}`;

  try {
    console.log(`[${new Date().toISOString()}] Resolving stream for: ${videoId}`);

    // Get best video+audio URL using yt-dlp
    const { stdout } = await execAsync(
      `yt-dlp -f "bestvideo[ext=mp4]+bestaudio[ext=m4a]/best[ext=mp4]/best" --get-url "${youtubeUrl}"`,
    );

    const streamUrl = stdout.trim().split('\n')[0]; // First URL is the video

    console.log(`[${new Date().toISOString()}] Redirecting to: ${streamUrl.substring(0, 100)}...`);

    // Redirect Jellyfin to the direct stream URL
    res.redirect(302, streamUrl);
  } catch (error) {
    console.error(`[${new Date().toISOString()}] Error resolving ${videoId}:`, error);
    res.status(500).json({ error: 'Failed to resolve video stream' });
  }
});

app.get('/health', (req, res) => {
  res.json({ status: 'ok', service: 'jellytube-proxy' });
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`[${new Date().toISOString()}] JellyTube Proxy listening on port ${PORT}`);
});
