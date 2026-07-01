import { createContext, useState } from 'react';

export const RoomContext = createContext(null);

export function RoomProvider({ children }) {
  const [roomId, setRoomId] = useState(null);
  const [userRole, setUserRole] = useState('guest');
  const [videoUrl, setVideoUrl] = useState(null);
  const [playbackState, setPlaybackState] = useState({
    isPlaying: false,
    currentTimeSec: 0,
    lastUpdatedAt: null,
  });

  const value = {
    roomId, setRoomId,
    userRole, setUserRole,
    videoUrl, setVideoUrl,
    playbackState, setPlaybackState,
  };

  return <RoomContext.Provider value={value}>{children}</RoomContext.Provider>;
}
