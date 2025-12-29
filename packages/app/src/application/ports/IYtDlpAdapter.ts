export interface IYtDlpAdapter {
  getChannelVideos(channelUrl: string, maxVideos?: number): Promise<any[]>; // Returns raw JSON objects
  getVideoDetails(videoId: string): Promise<any>;
  getChannelInfo(channelUrl: string): Promise<{ name: string; id: string }>;
}
