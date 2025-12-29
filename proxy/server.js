import express from 'express';
import { exec, spawn } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);
const app = express();
const PORT = 3000;

app.get('/stream/:videoId', async (req, res) => {
  const { videoId } = req.params;
  const youtubeUrl = `https://www.youtube.com/watch?v=${videoId}`;

  try {
    console.log(`[${new Date().toISOString()}] Resolving stream for: ${videoId}`);

    // Get best video and audio URLs separately
    const { stdout } = await execAsync(
      `yt-dlp -f "bestvideo[ext=mp4]+bestaudio[ext=m4a]/best" --get-url "${youtubeUrl}"`,
    );

    const urls = stdout.trim().split('\n');
    const videoUrl = urls[0];
    const audioUrl = urls[1] || videoUrl; // If only one URL, it's already combined

    console.log(`[${new Date().toISOString()}] Video URL: ${videoUrl.substring(0, 80)}...`);
    if (urls.length > 1) {
      console.log(`[${new Date().toISOString()}] Audio URL: ${audioUrl.substring(0, 80)}...`);
    }

    // If we have separate streams, combine them with ffmpeg
    if (urls.length > 1) {
      console.log(`[${new Date().toISOString()}] Combining streams with ffmpeg...`);

      // Set headers for streaming
      res.setHeader('Content-Type', 'video/mp4');
      res.setHeader('Accept-Ranges', 'bytes');

      // Use ffmpeg to combine and stream
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
        'frag_keyframe+empty_moov',
        'pipe:1',
      ]);

      ffmpeg.stdout.pipe(res);

      ffmpeg.stderr.on('data', (data) => {
        // Log ffmpeg errors but don't spam
        const msg = data.toString();
        if (msg.includes('error') || msg.includes('Error')) {
          console.error(`[${new Date().toISOString()}] FFmpeg: ${msg}`);
        }
      });

      ffmpeg.on('close', (code) => {
        console.log(`[${new Date().toISOString()}] FFmpeg finished with code ${code}`);
      });

      req.on('close', () => {
        ffmpeg.kill('SIGKILL');
      });
    } else {
      // Single combined stream, just redirect
      console.log(`[${new Date().toISOString()}] Redirecting to combined stream`);
      res.redirect(302, videoUrl);
    }
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
