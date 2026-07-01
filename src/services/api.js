const API_URL = import.meta.env.VITE_API_URL;

async function request(path, options = {}) {
  const response = await fetch(`${API_URL}${path}`, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  });

  const body = await response.json();

  if (!response.ok || !body.success) {
    throw new Error(body.error?.message ?? 'Erreur API');
  }

  return body.data;
}

export function createRoom() {
  return request('/room', { method: 'POST' });
}

export function getRoom(id) {
  return request(`/room/${id}`);
}

export async function uploadVideo(roomId, file) {
  const form = new FormData();
  form.append('video', file);

  const response = await fetch(`${API_URL}/room/${roomId}/upload_video`, {
    method: 'POST',
    body: form,
  });

  const body = await response.json();

  if (!response.ok) {
    throw new Error(body.error?.message ?? 'Erreur upload');
  }

  return body;
}
