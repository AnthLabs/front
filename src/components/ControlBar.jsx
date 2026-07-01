import { useRoom } from '../context/useRoom';
import { sendControlAction } from '../services/socket';

export default function ControlBar({ playerRef }) {
  const { userRole, playbackState } = useRoom();
  const isPresenter = userRole === 'presenter';

  if (!isPresenter) {
    return (
      <div className="control-bar">
        <div
          className="control-bar__dot control-bar__dot--live"
          style={{ opacity: playbackState.isPlaying ? 1 : 0.3 }}
        />
        <span className="control-bar__status">
          {playbackState.isPlaying ? 'lecture en cours' : 'en pause'}
        </span>
        <span className="control-bar__role">guest</span>
      </div>
    );
  }

  const getPos = () =>
    playerRef?.current?.getCurrentTime?.() ?? playbackState.currentTimeSec;

  const handleSeekBackward = () => {
    const newPos = Math.max(0, getPos() - 10);
    playerRef?.current?.seekTo?.(newPos, 'seconds');
    sendControlAction('seek', { position_seconds: newPos });
  };

  const handleSeekForward = () => {
    const newPos = getPos() + 10;
    playerRef?.current?.seekTo?.(newPos, 'seconds');
    sendControlAction('seek', { position_seconds: newPos });
  };

  return (
    <div className="control-bar">
      <button className="control-bar__btn" onClick={handleSeekBackward} aria-label="Reculer de 10s">
        ← 10s
      </button>
      <span className="control-bar__hint">▶ via le lecteur</span>
      <button className="control-bar__btn" onClick={handleSeekForward} aria-label="Avancer de 10s">
        10s →
      </button>
      <span className="control-bar__timecode">{formatTime(playbackState.currentTimeSec)}</span>
    </div>
  );
}

function formatTime(totalSeconds) {
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = Math.floor(totalSeconds % 60).toString().padStart(2, '0');
  return `${minutes}:${seconds}`;
}
