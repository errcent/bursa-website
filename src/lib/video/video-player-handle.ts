export type VideoPlayerHandle = {
  togglePlay: () => void;
  play: () => void;
  pause: () => void;
  getVideoElement: () => HTMLVideoElement | null;
  getPlaybackState: () => {
    isPlaying: boolean;
    currentTime: number;
    duration: number;
  };
};
