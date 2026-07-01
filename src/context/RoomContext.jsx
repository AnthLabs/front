import { useState } from 'react';
import { RoomContext } from './roomContext';

export function RoomProvider({ children }) {
  const [roomId, setRoomId] = useState(null);
  const [videoUrl, setVideoUrl] = useState(null);
  const [playbackState, setPlaybackState] = useState({
    isPlaying: false,
    currentTimeSec: 0,
    lastUpdatedAt: null,
  });

  const value = {
    roomId,
    setRoomId,
    videoUrl,
    setVideoUrl,
    playbackState,
    setPlaybackState,
  };

  return <RoomContext.Provider value={value}>{children}</RoomContext.Provider>;
}
