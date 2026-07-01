import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useRoom } from '../../context/useRoom';
import { createRoom, getRoom } from '../../services/api';
import lobbyBg from '../../assets/lobby-bg.png';

export default function Lobby() {
  const navigate = useNavigate();
  const { setRoomId } = useRoom();

  const [joinId, setJoinId] = useState('');
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleCreate = async () => {
    setError(null);
    setLoading(true);
    try {
      const room = await createRoom();
      setRoomId(room.id);
      navigate(`/room/${room.id}`);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleJoin = async (e) => {
    e.preventDefault();
    if (!joinId.trim()) return;
    setError(null);
    setLoading(true);
    try {
      const room = await getRoom(joinId.trim());
      setRoomId(room.id);
      navigate(`/room/${room.id}`);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="lobby" style={{ backgroundImage: `url(${lobbyBg})` }}>
      <div>
        <p className="lobby__eyebrow">session synchronisée</p>
        <h1 className="lobby__title">
          <span className="lobby__title-accent">watch</span>_room
          <span className="lobby__cursor" aria-hidden="true" />
        </h1>
      </div>

      <div className="lobby__actions">
        <button className="btn btn--primary" onClick={handleCreate} disabled={loading}>
          {loading ? '...' : '+ créer un salon'}
        </button>

        <div className="lobby__divider">ou</div>

        <form onSubmit={handleJoin}>
          <div className="input-group">
            <input
              className="input"
              type="text"
              placeholder="id du salon"
              value={joinId}
              onChange={(e) => setJoinId(e.target.value)}
              disabled={loading}
              spellCheck={false}
            />
            <button
              className="btn"
              type="submit"
              disabled={loading || !joinId.trim()}
            >
              rejoindre →
            </button>
          </div>
        </form>

        {error && <p className="lobby__error">{error}</p>}
      </div>
    </div>
  );
}
