const configuredApiUrl = import.meta.env.VITE_API_URL?.trim();

const API_URL = configuredApiUrl
  ? configuredApiUrl.replace(/\/+$/, '')
  : `${window.location.origin}/api`;

async function readResponseBody(response) {
  const contentType = response.headers.get('content-type') ?? '';

  if (contentType.includes('application/json')) {
    return response.json();
  }

  const text = await response.text();

  throw new Error(
    text || `Réponse invalide du serveur (${response.status})`,
  );
}

async function request(path, options = {}) {
  const response = await fetch(`${API_URL}${path}`, {
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
    ...options,
  });

  const body = await readResponseBody(response);

  if (!response.ok || !body.success) {
    throw new Error(
      body.error?.message ?? `Erreur API (${response.status})`,
    );
  }

  return body.data;
}

export function createRoom() {
  return request('/room', {
    method: 'POST',
  });
}

export function getRoom(id) {
  return request(`/room/${id}`);
}

export async function uploadVideo(roomId, file) {
  const form = new FormData();
  form.append('video', file);

  const response = await fetch(
    `${API_URL}/room/${roomId}/upload_video`,
    {
      method: 'POST',
      body: form,
    },
  );

  const body = await readResponseBody(response);

  if (!response.ok) {
    throw new Error(
      body.error?.message ?? `Erreur upload (${response.status})`,
    );
  }

  return body.data ?? body;
}
