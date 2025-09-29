import { GalleryItem, GalleryMediaType, NodeType } from '../types';

type CreateGalleryItemRequest = {
  dataUrl: string;
  type: GalleryMediaType;
  prompt?: string;
  nodeType?: NodeType;
  nodeId?: string;
  projectId?: string;
};

const handleResponse = async (response: Response) => {
  if (!response.ok) {
    const text = await response.text().catch(() => '');
    throw new Error(text || `Request failed with status ${response.status}`);
  }
  if (response.status === 204) {
    return undefined;
  }
  const text = await response.text();
  return text ? JSON.parse(text) : undefined;
};

export const fetchGalleryItems = async (projectId?: string): Promise<GalleryItem[]> => {
  const url = projectId ? `/api/gallery?projectId=${encodeURIComponent(projectId)}` : '/api/gallery';
  const data = await handleResponse(await fetch(url)) as { items?: GalleryItem[] } | undefined;
  return data?.items ?? [];
};

export const createGalleryItem = async (payload: CreateGalleryItemRequest): Promise<GalleryItem> => {
  const data = await handleResponse(await fetch('/api/gallery', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })) as { item: GalleryItem };
  return data.item;
};

export const deleteGalleryItem = async (id: string): Promise<void> => {
  await handleResponse(await fetch(`/api/gallery/${id}`, {
    method: 'DELETE',
  }));
};
