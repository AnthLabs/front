let socketInstance = null;
let onStatusChange = null;

function getWebSocketBaseUrl() {
  const configuredWsUrl =
    import.meta.env.VITE_WS_URL?.trim();

  if (configuredWsUrl) {
    return configuredWsUrl.replace(/\/+$/, '');
  }

  const protocol =
    window.location.protocol === 'https:' ? 'wss:' : 'ws:';

  return `${protocol}//${window.location.host}/api`;
}

export function connectToRoom(
  roomId,
  onMessage,
  onStatus,
) {
  const wsBaseUrl = getWebSocketBaseUrl();
  const wsUrl = `${wsBaseUrl}/room/${roomId}/ws`;

  onStatusChange = onStatus ?? null;

  const socket = new WebSocket(wsUrl);
  socketInstance = socket;

  socket.onopen = () => {
    if (socketInstance !== socket) {
      return;
    }

    onStatusChange?.('open');
  };

  socket.onmessage = (event) => {
    try {
      const parsed = JSON.parse(event.data);
      onMessage(parsed);
    } catch (error) {
      console.error(
        '[WS] Message invalide reçu :',
        error,
      );
    }
  };

  socket.onerror = (event) => {
    if (socketInstance !== socket) {
      return;
    }

    console.error('[WS] Erreur WebSocket :', event);
    onStatusChange?.('error');
  };

  socket.onclose = (event) => {
    if (socketInstance !== socket) {
      return;
    }

    console.warn(
      '[WS] Fermé — code :',
      event.code,
      event.reason
        ? `raison : ${event.reason}`
        : '',
    );

    onStatusChange?.('closed');
    socketInstance = null;
  };

  return socket;
}

export function sendControlAction(
  actionType,
  payload = {},
) {
  if (
    !socketInstance ||
    socketInstance.readyState !== WebSocket.OPEN
  ) {
    console.warn(
      '[WS] Action ignorée : socket non connecté',
      socketInstance?.readyState,
    );

    return;
  }

  socketInstance.send(
    JSON.stringify({
      type: actionType,
      ...payload,
    }),
  );
}

export function disconnectFromRoom() {
  socketInstance?.close();
  socketInstance = null;
}
