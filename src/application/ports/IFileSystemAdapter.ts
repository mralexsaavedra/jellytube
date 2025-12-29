import { Video } from '../../domain/entities/Video';
import { Channel } from '../../domain/entities/Channel';

export interface IFileSystemAdapter {
  ensureDirectory(path: string): Promise<void>;
  writeStrmFile(path: string, url: string): Promise<void>;
  writeNfoFile(path: string, video: Video, channel: Channel): Promise<void>;
  fileExists(path: string): Promise<boolean>;
  downloadImage(url: string, destPath: string): Promise<void>;
}
