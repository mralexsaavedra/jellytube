// eslint-disable-next-line @typescript-eslint/no-require-imports
const execa = require('execa');
import { IYtDlpAdapter } from '../../application/ports/IYtDlpAdapter';
import { logger } from '../logging/Logger';
import { Config } from '../config/Config';

export class YtDlpAdapter implements IYtDlpAdapter {
  async getChannelVideos(channelUrl: string, maxVideos: number = 50): Promise<any[]> {
    logger.info({ channelUrl }, 'Fetching channel videos...');
    try {
      // --flat-playlist: Do not extract video details, just playlist
      // --dump-json: Output JSON
      // --playlist-end: Limit number of videos to check (optional, but good for performance)

      const matchFilters: string[] = [];
      if (Config.SKIP_SHORTS) {
        // Exclude videos where URL resembles a short or duration is typically short (fallback)
        // Note: original_url is the safest check for Shorts in flat-playlist
        matchFilters.push('original_url!*=/shorts/');
      }
      if (Config.SKIP_LIVES) {
        // Exclude live streams (is_live) and VODs of lives (was_live) if desired?
        // Usually "lives" implies current or upcoming.
        // Let's filter is_live (current) and live_status check.
        matchFilters.push('!is_live');
      }

      const args = [
        '--flat-playlist',
        '--dump-json',
        '--no-warnings',
        '--playlist-end',
        maxVideos.toString(),
        channelUrl,
      ];

      if (matchFilters.length > 0) {
        args.push('--match-filter', matchFilters.join(' & '));
      }

      const { stdout } = await execa('yt-dlp', args);

      // Output is line-delimited JSON
      const videos = stdout
        .trim()
        .split('\n')
        .map((line: string) => {
          try {
            return JSON.parse(line);
          } catch {
            logger.warn('Failed to parse JSON line from yt-dlp');
            return null;
          }
        })
        .filter((v: any) => v !== null)
        .slice(0, maxVideos);

      return videos;
    } catch (error) {
      logger.error({ error }, 'Error fetching channel videos');
      throw error;
    }
  }

  async getVideoDetails(videoId: string): Promise<any> {
    try {
      const args = [
        '--dump-json',
        '--skip-download',
        '--no-warnings',
        `https://www.youtube.com/watch?v=${videoId}`,
      ];
      const { stdout } = await execa('yt-dlp', args);
      return JSON.parse(stdout);
    } catch (error) {
      logger.error({ error, videoId }, 'Error fetching single video details');
      throw error;
    }
  }

  async getChannelInfo(channelUrl: string): Promise<{ name: string; id: string }> {
    // Get just one entry to get channel metadata, or use specific flag
    try {
      const args = [
        '--flat-playlist',
        '--dump-json',
        '--playlist-items',
        '1',
        '--no-warnings',
        channelUrl,
      ];
      const { stdout } = await execa('yt-dlp', args);
      const constData = JSON.parse(stdout.split('\n')[0]);
      return {
        name:
          constData.uploader ||
          constData.channel ||
          constData.playlist_uploader ||
          constData.playlist_title ||
          'Unknown Channel',
        id:
          constData.channel_id ||
          constData.uploader_id ||
          constData.playlist_channel_id ||
          constData.playlist_id,
      };
    } catch (error) {
      logger.error({ error }, 'Error fetching channel info');
      throw error;
    }
  }
}
