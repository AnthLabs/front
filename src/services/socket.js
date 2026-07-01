let socketInstance = null;
let onStatusChange = null;

export function connectToRoom(roomId, onMessage, onStatus) {
  const wsUrl = `${import.meta.env.VITE_WS_URL}/room/${roomId}/ws`;
  onStatusChange = onStatus ?? null;

  const socket = new WebSocket(wsUrl);
  socketInstance = socket;

  socket.onopen = () => {
    if (socketInstance !== socket) return;
    onStatusChange?.('open');
  };

  socket.onmessage = (event) => {
    const parsed = JSON.parse(event.data);
    onMessage(parsed);
  };

  socket.onerror = () => {
    if (socketInstance !== socket) return;
    onStatusChange?.('error');
  };

  socket.onclose = (e) => {
    if (socketInstance !== socket) return;
    console.warn('[WS] fermé — code:', e.code, e.reason ? `raison: ${e.reason}` : '');
    onStatusChange?.('closed');
    socketInstance = null;
  };

  return socket;
}

export function sendControlAction(actionType, payload = {}) {
  if (!socketInstance || socketInstance.readyState !== WebSocket.OPEN) {
    console.warn('[WS] sendControlAction ignoré — socket non connecté (readyState:', socketInstance?.readyState, ')');
    return;
  }
  socketInstance.send(JSON.stringify({ type: actionType, ...payload }));
}

export function disconnectFromRoom() {
  socketInstance?.close();
}
