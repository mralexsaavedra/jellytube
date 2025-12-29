import express from 'express';
import { exec, spawn } from 'child_process';
import { promisify } from 'util';
import fs from 'fs';
import path from 'path';

const execAsync = promisify(exec);
const app = express();
const PORT = 3000;
const CACHE_DIR = '/tmp/jellytube-cache';

// Ensure cache directory exists
if (!fs.existsSync(CACHE_DIR)) {
  fs.mkdirSync(CACHE_DIR, { recursive: true });
}

app.get('/stream/:videoId', async (req, res) => {
  const { videoId } = req.params;
  const youtubeUrl = `https://www.youtube.com/watch?v=${videoId}`;
  const cacheFile = path.join(CACHE_DIR, `${videoId}.mp4`);

  try {
    // Check if already cached
    if (fs.existsSync(cacheFile)) {
      console.log(`[${new Date().toISOString()}] Serving cached file for: ${videoId}`);
      return res.sendFile(cacheFile);
    }

    console.log(`[${new Date().toISOString()}] Resolving stream for: ${videoId}`);

    // Get best video and audio URLs separately
    const { stdout } = await execAsync(
      `yt-dlp -f "bestvideo[height<=1080][ext=mp4]+bestaudio[ext=m4a]/best" --get-url "${youtubeUrl}"`,
    );

    const urls = stdout.trim().split('\n');
    const videoUrl = urls[0];
    const audioUrl = urls[1] || videoUrl;

    // If only one URL, it's already combined - just redirect
    if (urls.length === 1) {
      console.log(`[${new Date().toISOString()}] Redirecting to pre-combined stream`);
      return res.redirect(302, videoUrl);
    }

    console.log(`[${new Date().toISOString()}] Combining streams with ffmpeg for ${videoId}...`);

    // Combine streams and save to cache
    const ffmpeg = spawn('ffmpeg', [
      '-i',
      videoUrl,
      '-i',
      audioUrl,
      '-c',
      'copy',
      '-f',
      'mp4',
      '-movflags',
      'faststart',
      cacheFile,
    ]);

    let ffmpegError = '';
    ffmpeg.stderr.on('data', (data) => {
      ffmpegError += data.toString();
    });

    ffmpeg.on('close', (code) => {
      if (code === 0) {
        console.log(`[${new Date().toISOString()}] Successfully cached ${videoId}`);
      } else {
        console.error(`[${new Date().toISOString()}] FFmpeg failed for ${videoId}: ${ffmpegError}`);
        // Clean up partial file
        if (fs.existsSync(cacheFile)) {
          fs.unlinkSync(cacheFile);
        }
      }
    });

    // Wait for ffmpeg to finish, then serve the file
    await new Promise((resolve, reject) => {
      ffmpeg.on('close', (code) => {
        if (code === 0) resolve();
        else reject(new Error(`FFmpeg exited with code ${code}`));
      });
    });

    res.sendFile(cacheFile);
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
  console.log(`[${new Date().toISOString()}] Cache directory: ${CACHE_DIR}`);
});
