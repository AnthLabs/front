import { useEffect, useRef, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useRoom } from '../../context/useRoom';
import { connectToRoom, disconnectFromRoom, sendControlAction } from '../../services/socket';
import { uploadVideo } from '../../services/api';
import VideoPlayer from '../../components/VideoPlayer';
import ControlBar from '../../components/ControlBar';

export default function Room() {
  const { roomId: roomIdParam } = useParams();
  const navigate = useNavigate();
  const { roomId, setRoomId, userRole, videoUrl, setVideoUrl, setPlaybackState } = useRoom();

  const [wsError, setWsError] = useState(null);
  const [wsStatus, setWsStatus] = useState('connecting');
  const [pendingVideoUrl, setPendingVideoUrl] = useState('');
  const [uploadError, setUploadError] = useState(null);
  const [uploading, setUploading] = useState(false);

  const presenterFileRef = useRef(null);
  const playerRef = useRef(null);

  const activeRoomId = roomId ?? roomIdParam;
  const isPresenter = userRole === 'presenter';
  const activeStreamUrl = videoUrl;

  useEffect(() => {
    if (roomIdParam && !roomId) setRoomId(roomIdParam);
  }, [roomIdParam, roomId, setRoomId]);

  useEffect(() => {
    if (!activeRoomId) return;

    connectToRoom(
      activeRoomId,
      (message) => {
        if (message.type === 'room_updated') {
          const { room } = message;
          setVideoUrl(room.video_url ?? null);
          setPlaybackState({
            isPlaying: room.video_status === 'playing',
            currentTimeSec: room.position_seconds,
            lastUpdatedAt: room.updated_at ? room.updated_at * 1000 : Date.now(),
          });
          setWsError(null);
        } else if (message.type === 'error') {
          console.error('[WS] erreur serveur :', message);
          setWsError(message.message);
        }
      },
      (status) => setWsStatus(status),
    );

    return () => disconnectFromRoom();
  }, [activeRoomId, setPlaybackState, setVideoUrl]);

  const handleLeave = () => {
    disconnectFromRoom();
    setRoomId(null);
    setVideoUrl(null);
    setPlaybackState({ isPlaying: false, currentTimeSec: 0, lastUpdatedAt: null });
    navigate('/');
  };

  const handleChangeVideo = (e) => {
    e.preventDefault();
    if (!pendingVideoUrl.trim()) return;
    sendControlAction('change_video', { video_url: pendingVideoUrl.trim() });
    setPendingVideoUrl('');
  };

  const handleFileSelect = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    e.target.value = '';
    setUploadError(null);
    setUploading(true);
    try {
      await uploadVideo(activeRoomId, file);
      // Le serveur broadcast room_updated avec l'URL HLS → videoUrl se met à jour via WS
    } catch (err) {
      setUploadError(err.message);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="room">
      <div className="room__video-wrapper">
        {activeStreamUrl ? (
          <VideoPlayer streamUrl={activeStreamUrl} playerRef={playerRef} />
        ) : (
          <div className="room__no-video">
            {isPresenter
              ? 'aucun flux — définissez une URL ou téléversez un fichier ci-dessous'
              : 'en attente du présentateur…'}
          </div>
        )}

        <div className="room__badge">
          <span className="room__badge-role">{userRole}</span>
          <span className="room__badge-sep">·</span>
          <span>{activeRoomId}</span>
        </div>

        <button className="room__back" onClick={handleLeave} aria-label="Quitter le salon">
          ← quitter
        </button>
      </div>

      <ControlBar playerRef={playerRef} />

      {isPresenter && (
        <form className="room__video-bar" onSubmit={handleChangeVideo}>
          <span className="room__video-bar-label">flux</span>
          <input
            className="input"
            type="text"
            placeholder="youtube.com/watch?v=… ou https://…/stream.m3u8"
            value={pendingVideoUrl}
            onChange={(e) => setPendingVideoUrl(e.target.value)}
            spellCheck={false}
          />
          <button className="btn" type="submit" disabled={!pendingVideoUrl.trim()}>
            charger →
          </button>
          <span className="room__video-bar-sep">ou</span>
          <button
            className="btn"
            type="button"
            disabled={uploading}
            onClick={() => presenterFileRef.current?.click()}
          >
            {uploading ? 'upload…' : 'téléverser'}
          </button>
          <input
            ref={presenterFileRef}
            type="file"
            accept="video/*"
            hidden
            onChange={handleFileSelect}
          />
          <span className={`room__ws-status room__ws-status--${wsStatus}`}>
            {wsStatus === 'open' ? '● ws' : wsStatus === 'connecting' ? '○ ws…' : '✗ ws'}
          </span>
          {wsError && <span className="room__ws-error">✗ {wsError}</span>}
          {uploadError && <span className="room__ws-error">✗ upload: {uploadError}</span>}
        </form>
      )}
    </div>
  );
}
