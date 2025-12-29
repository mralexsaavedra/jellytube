import { YtDlpAdapter } from './infrastructure/adapters/YtDlpAdapter';
import { FileSystemAdapter } from './infrastructure/adapters/FileSystemAdapter';
import { SyncChannelUseCase } from './application/use-cases/SyncChannelUseCase';
import { logger } from './infrastructure/logging/Logger';

// Helper to catch unhandled errors
const syncChannels = async () => {
  const channelsEnv = process.env.CHANNELS;

  if (!channelsEnv) {
    logger.error('No channels configured. Set CHANNELS env var (comma separated URLs).');
    process.exit(1);
  }

  const channels = channelsEnv
    .split(',')
    .map((c) => c.trim())
    .filter((c) => c.length > 0);

  const ytDlpHelpers = new YtDlpAdapter();
  const fsHelpers = new FileSystemAdapter();
  const syncUseCase = new SyncChannelUseCase(ytDlpHelpers, fsHelpers);

  logger.info(`Starting sync for ${channels.length} channels...`);

  for (const channelUrl of channels) {
    try {
      await syncUseCase.execute(channelUrl);
    } catch (err) {
      logger.error({ channelUrl, err }, 'Failed to sync channel, continuing to next...');
    }
  }

  logger.info('All channels processed.');
};

const main = async () => {
  try {
    // Get sync interval from env (in hours, default 6)
    const syncIntervalHours = parseInt(process.env.SYNC_INTERVAL_HOURS || '6', 10);
    const syncIntervalMs = syncIntervalHours * 60 * 60 * 1000;

    logger.info(`JellyTube started. Sync interval: ${syncIntervalHours} hours`);

    // Run immediately on startup
    await syncChannels();

    // Then run periodically
    setInterval(async () => {
      logger.info('Starting scheduled sync...');
      await syncChannels();
    }, syncIntervalMs);
  } catch (error) {
    logger.error({ error }, 'App crashed');
    process.exit(1);
  }
};

main();
