import { Video } from './Video';

export class Channel {
  constructor(
    public readonly id: string,
    public readonly name: string,
    public readonly url: string,
    public readonly videos: Video[] = [],
  ) {}

  get sanitizedName(): string {
    return this.name.replace(/[<>:"/\\|?*]/g, '').trim();
  }
}
