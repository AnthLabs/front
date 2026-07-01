import { useRef, useEffect } from 'react';
import ReactPlayer from 'react-player';
import { useRoom } from '../context/useRoom';
import { sendControlAction } from '../services/socket';

const SYNC_DRIFT_THRESHOLD_SEC = 1.5;

export default function VideoPlayer({ streamUrl, playerRef }) {
  const lastPosRef = useRef(0);
  const { userRole, playbackState } = useRoom();
  const isPresenter = userRole === 'presenter';

  // Invité : recale sur l'état WS
  useEffect(() => {
    if (isPresenter || !playbackState.lastUpdatedAt) return;
    const player = playerRef.current;
    if (!player) return;

    const networkDelaySec = (Date.now() - playbackState.lastUpdatedAt) / 1000;
    const expectedTimeSec =
      playbackState.currentTimeSec + (playbackState.isPlaying ? networkDelaySec : 0);
    const currentTime = player.getCurrentTime() ?? 0;

    if (Math.abs(currentTime - expectedTimeSec) > SYNC_DRIFT_THRESHOLD_SEC) {
      player.seekTo(expectedTimeSec, 'seconds');
    }
  }, [playbackState, isPresenter, playerRef]);

  const handleProgress = ({ playedSeconds }) => {
    lastPosRef.current = playedSeconds;
  };

  // Présentateur : les contrôles natifs YouTube déclenchent onPlay/onPause → WS
  const handlePlay = () => {
    if (!isPresenter) return;
    const pos = playerRef.current?.getCurrentTime() ?? 0;
    sendControlAction('play', { position_seconds: pos });
  };

  const handlePause = () => {
    if (!isPresenter) return;
    const pos = playerRef.current?.getCurrentTime() ?? 0;
    sendControlAction('pause', { position_seconds: pos });
  };

  if (isPresenter) {
    return (
      <ReactPlayer
        ref={playerRef}
        url={streamUrl}
        width="100%"
        height="100%"
        controls
        progressInterval={500}
        onPlay={handlePlay}
        onPause={handlePause}
        onProgress={handleProgress}
        onError={(err) => console.error('[Player] erreur :', err)}
      />
    );
  }

  return (
    <ReactPlayer
      ref={playerRef}
      url={streamUrl}
      width="100%"
      height="100%"
      controls={false}
      playing={playbackState.isPlaying}
      progressInterval={500}
      onProgress={handleProgress}
      onError={(err) => console.error('[Player] erreur :', err)}
    />
  );
}
