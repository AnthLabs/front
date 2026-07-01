import { useRef, useEffect } from 'react';
import ReactPlayer from 'react-player';
import { useRoom } from '../context/useRoom';
import { sendControlAction } from '../services/socket';

const SYNC_DRIFT_THRESHOLD_SEC = 1.5;
const ECHO_SUPPRESSION_WINDOW_MS = 600;

export default function VideoPlayer({ streamUrl, playerRef }) {
  const lastPosRef = useRef(0);
  const lastProgrammaticSyncAtRef = useRef(0);
  const { playbackState } = useRoom();

  useEffect(() => {
    const player = playerRef.current;
    if (!player || !playbackState.lastUpdatedAt) return;

    const networkDelaySec = (Date.now() - playbackState.lastUpdatedAt) / 1000;
    const expectedTimeSec =
      playbackState.currentTimeSec + (playbackState.isPlaying ? networkDelaySec : 0);
    const currentTime = player.currentTime ?? 0;
    let touchedPlayer = false;

    if (Math.abs(currentTime - expectedTimeSec) > SYNC_DRIFT_THRESHOLD_SEC) {
      player.currentTime = expectedTimeSec;
      touchedPlayer = true;
    }

    if (playbackState.isPlaying && player.paused) {
      player.play();
      touchedPlayer = true;
    } else if (!playbackState.isPlaying && !player.paused) {
      player.pause();
      touchedPlayer = true;
    }

    if (touchedPlayer) lastProgrammaticSyncAtRef.current = Date.now();
  }, [playbackState, playerRef]);

  const isEchoOfOwnSync = () =>
    Date.now() - lastProgrammaticSyncAtRef.current < ECHO_SUPPRESSION_WINDOW_MS;

  const handleProgress = (event) => {
    lastPosRef.current = event.target?.currentTime ?? 0;
  };

  const handlePlay = (event) => {
    if (isEchoOfOwnSync()) return;
    sendControlAction('play', { position_seconds: event.target?.currentTime ?? 0 });
  };

  const handlePause = (event) => {
    if (isEchoOfOwnSync()) return;
    sendControlAction('pause', { position_seconds: event.target?.currentTime ?? 0 });
  };

  return (
    <ReactPlayer
      ref={playerRef}
      src={streamUrl}
      width="100%"
      height="100%"
      controls={false}
      onPlay={handlePlay}
      onPause={handlePause}
      onProgress={handleProgress}
      onError={(err) => console.error('[Player] erreur :', err)}
    />
  );
}
