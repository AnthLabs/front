import { useEffect, useState } from 'react';
import { sendControlAction } from '../services/socket';

const POLL_INTERVAL_MS = 250;

export default function ControlBar({ playerRef }) {
  const [duration, setDuration] = useState(0);
  const [livePosition, setLivePosition] = useState(0);
  const [isPaused, setIsPaused] = useState(true);
  const [dragPosition, setDragPosition] = useState(null);

  useEffect(() => {
    const interval = setInterval(() => {
      const player = playerRef?.current;
      if (!player) return;
      if (Number.isFinite(player.duration) && player.duration > 0) setDuration(player.duration);
      if (dragPosition === null) setLivePosition(player.currentTime ?? 0);
      setIsPaused(player.paused);
    }, POLL_INTERVAL_MS);
    return () => clearInterval(interval);
  }, [playerRef, dragPosition]);

  const seekPlayer = (position) => {
    const clamped = duration ? Math.min(Math.max(position, 0), duration) : Math.max(position, 0);
    if (playerRef?.current) playerRef.current.currentTime = clamped;
    setLivePosition(clamped);
    sendControlAction('seek', { position_seconds: clamped });
  };

  const handleSeekBackward = () => seekPlayer(livePosition - 10);
  const handleSeekForward = () => seekPlayer(livePosition + 10);

  const handleTogglePlay = () => {
    const player = playerRef?.current;
    if (!player) return;
    if (player.paused) player.play();
    else player.pause();
  };

  const displayedPosition = dragPosition ?? livePosition;

  const handleScrubInput = (e) => setDragPosition(Number(e.target.value));

  const commitScrub = (e) => {
    seekPlayer(Number(e.target.value));
    setDragPosition(null);
  };

  return (
    <div className="control-bar">
      <button
        className="control-bar__btn control-bar__btn--play"
        onClick={handleTogglePlay}
        aria-label={isPaused ? 'Lecture' : 'Pause'}
      >
        {isPaused ? '▶ lecture' : '❚❚ pause'}
      </button>
      <button className="control-bar__btn" onClick={handleSeekBackward} aria-label="Reculer de 10s">
        ← 10s
      </button>
      <input
        className="control-bar__scrub"
        type="range"
        min={0}
        max={duration || 0}
        step={0.1}
        value={Math.min(displayedPosition, duration || displayedPosition)}
        disabled={!duration}
        onChange={handleScrubInput}
        onMouseUp={commitScrub}
        onTouchEnd={commitScrub}
        onKeyUp={commitScrub}
        aria-label="Position de lecture"
      />
      <button className="control-bar__btn" onClick={handleSeekForward} aria-label="Avancer de 10s">
        10s →
      </button>
      <span className="control-bar__timecode">
        {formatTime(displayedPosition)} / {formatTime(duration)}
      </span>
    </div>
  );
}

function formatTime(totalSeconds) {
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = Math.floor(totalSeconds % 60).toString().padStart(2, '0');
  return `${minutes}:${seconds}`;
}
