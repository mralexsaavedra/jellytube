export class Video {
  constructor(
    public readonly id: string,
    public readonly title: string,
    public readonly uploadDate?: string, // YYYYMMDD
    public readonly duration?: number, // seconds
    public readonly description?: string,
  ) {}

  get seasonYear(): string {
    if (!this.uploadDate || this.uploadDate.length < 4) {
      return 'Unknown';
    }
    return this.uploadDate.substring(0, 4);
  }

  get sanitizedTitle(): string {
    return this.title.replace(/[<>:"/\\|?*]/g, '').trim();
  }
}
