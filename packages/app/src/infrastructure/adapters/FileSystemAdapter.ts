import * as fs from 'fs-extra';
import * as https from 'https';
import { IFileSystemAdapter } from '../../application/ports/IFileSystemAdapter';
import { Video } from '../../domain/entities/Video';
import { Channel } from '../../domain/entities/Channel';
import { logger } from '../logging/Logger';

export class FileSystemAdapter implements IFileSystemAdapter {
  async ensureDirectory(dirPath: string): Promise<void> {
    await fs.ensureDir(dirPath);
  }

  async fileExists(filePath: string): Promise<boolean> {
    return fs.pathExists(filePath);
  }

  async writeStrmFile(filePath: string, url: string): Promise<void> {
    await fs.outputFile(filePath, url);
    logger.debug({ filePath }, 'Created .strm file');
  }

  async writeNfoFile(filePath: string, video: Video, channel: Channel): Promise<void> {
    const nfoContent = `<?xml version="1.0" encoding="UTF-8" standalone="yes" ?>
<episodedetails>
  <title>${this.escapeXml(video.title)}</title>
  <showtitle>${this.escapeXml(channel.name)}</showtitle>
  <plot>${this.escapeXml(video.description || '')}</plot>
  <season>${video.seasonYear}</season>
  <aired>${this.formatDate(video.uploadDate || '')}</aired>
  <uniqueid type="youtube">${video.id}</uniqueid>
  <studio>${this.escapeXml(channel.name)}</studio>
</episodedetails>`;

    await fs.outputFile(filePath, nfoContent);
    logger.debug({ filePath }, 'Created .nfo file');
  }

  private escapeXml(unsafe: string): string {
    return unsafe.replace(/[<>&'"]/g, (c) => {
      switch (c) {
        case '<':
          return '&lt;';
        case '>':
          return '&gt;';
        case '&':
          return '&amp;';
        case "'":
          return '&apos;';
        case '"':
          return '&quot;';
        default:
          return c;
      }
    });
  }

  private formatDate(dateStr: string): string {
    // Assuming YYYYMMDD
    if (dateStr && dateStr.length === 8) {
      return `${dateStr.substring(0, 4)}-${dateStr.substring(4, 6)}-${dateStr.substring(6, 8)}`;
    }
    return '';
  }

  async downloadImage(url: string, destPath: string): Promise<void> {
    return new Promise((resolve, reject) => {
      https
        .get(url, (response) => {
          if (response.statusCode !== 200) {
            reject(new Error(`Failed to download image: ${response.statusCode}`));
            return;
          }

          const fileStream = fs.createWriteStream(destPath);
          response.pipe(fileStream);

          fileStream.on('finish', () => {
            fileStream.close();
            resolve();
          });

          fileStream.on('error', (err) => {
            fs.unlink(destPath, () => reject(err));
          });
        })
        .on('error', reject);
    });
  }
}
