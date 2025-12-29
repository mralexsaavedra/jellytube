// eslint-disable-next-line @typescript-eslint/no-require-imports
import pLimit = require('p-limit');
import * as path from 'path';
import { IYtDlpAdapter } from '../ports/IYtDlpAdapter';
import { IFileSystemAdapter } from '../ports/IFileSystemAdapter';
import { Config } from '../../infrastructure/config/Config';
import { Video } from '../../domain/entities/Video';
import { Channel } from '../../domain/entities/Channel';
import { logger } from '../../infrastructure/logging/Logger';

export class SyncChannelUseCase {
  constructor(
    private readonly ytDlp: IYtDlpAdapter,
    private readonly fsAdapter: IFileSystemAdapter,
  ) {}

  async execute(channelUrl: string): Promise<void> {
    logger.info({ channelUrl }, 'Starting channel sync');

    // 1. Get Channel Info
    const info = await this.ytDlp.getChannelInfo(channelUrl);
    const channel = new Channel(info.id, info.name, channelUrl);

    // 2. Fetch Videos
    // In a real scenario, we might want to fetch all or use an archive file.
    // For now, let's assume we fetch the last 50 or configured amount
    const rawVideos = await this.ytDlp.getChannelVideos(channelUrl, Config.MAX_VIDEOS);
    logger.info({ count: rawVideos.length, channel: channel.name }, 'Found videos');

    const limit = pLimit(Config.CONCURRENCY_LIMIT);

    const tasks = rawVideos.map((v: any) => {
      return limit(async () => {
        try {
          logger.info({ videoId: v.id }, 'Processing video details...');
          await this.processVideo(v, channel);
        } catch (err) {
          logger.error({ videoId: v.id, err }, 'Failed to process video');
        }
      });
    });

    await Promise.all(tasks);
    logger.info({ channel: channel.name }, 'Channel sync completed');
  }

  private async processVideo(basicVideoInfo: any, channel: Channel): Promise<void> {
    // 1. Construct potential paths first to check existence
    // We need basic info (id, title) to guess path, but title might change slightly with full metadata.
    // However, we rely on the ID for uniqueness.
    // Let's rely on basic info for the check. If it exists, skip.
    // Wait, we need the Season Year to know the folder.
    // If we only have basic info without date, we can't check the exact season folder existence comfortably without scanning.
    // BUT! Since we are refactoring to get full details, let's just do it for now correctly.

    // OPTIMIZATION:
    // If strict Zero-Storage is fast enough, we might not assume folder.
    // But to be proper:
    // We fetch details to get the DATE.

    // If the basic info from flat-playlist DOES NOT have upload_date (which it usually doesn't),
    // we MUST fetch details to proceed correctly with folder structure.

    // Attempt to avoid fetching if we can find the file?
    // We could search for the ID in the output dir? Too expensive.

    // Let's just fetch details. concurrency limit helps.
    let fullDetails: any;
    try {
      fullDetails = await this.ytDlp.getVideoDetails(basicVideoInfo.id);
    } catch {
      logger.warn({ videoId: basicVideoInfo.id }, 'Could not fetch details, skipping');
      return;
    }

    const video = new Video(
      fullDetails.id,
      fullDetails.title,
      fullDetails.upload_date,
      fullDetails.duration,
      fullDetails.description,
    );

    // Path Construction
    const seasonDir = `Season ${video.seasonYear}`;
    const fileName = `${video.sanitizedTitle} [${video.id}]`;

    const relativePath = path.join(channel.sanitizedName, seasonDir);

    const fullDir = path.join(Config.OUTPUT_DIR, relativePath);
    await this.fsAdapter.ensureDirectory(fullDir);

    const strmPath = path.join(fullDir, `${fileName}.strm`);
    const nfoPath = path.join(fullDir, `${fileName}.nfo`);

    // STRM Content
    const invidiousUrl = Config.INVIDIOUS_URL.replace(/\/$/, '');
    const finalStrmContent = `${invidiousUrl}/api/v1/videos/${video.id}`;

    if (!(await this.fsAdapter.fileExists(strmPath))) {
      await this.fsAdapter.writeStrmFile(strmPath, finalStrmContent);
    }

    if (!(await this.fsAdapter.fileExists(nfoPath))) {
      await this.fsAdapter.writeNfoFile(nfoPath, video, channel);
    }
  }
}
